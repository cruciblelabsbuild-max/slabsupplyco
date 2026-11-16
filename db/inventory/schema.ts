// Applied idempotently; seed inserts never reset reserved or sold stock.
export const inventorySchema = `
CREATE TABLE IF NOT EXISTS ssc_checkouts (
 id uuid PRIMARY KEY, user_id text NOT NULL, cart_hash text NOT NULL,
 slugs text[] NOT NULL, payload jsonb NOT NULL,
 status text NOT NULL CHECK(status IN ('creating','open','paid','released')),
 session_id text UNIQUE, expires_at bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
-- statement
CREATE UNIQUE INDEX IF NOT EXISTS ssc_one_pending_checkout ON ssc_checkouts(user_id) WHERE status IN ('creating','open');
-- statement
CREATE TABLE IF NOT EXISTS ssc_inventory (
 slug text PRIMARY KEY, status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','sold')),
 reservation_id uuid REFERENCES ssc_checkouts(id), sold_session text
);
-- statement
CREATE TABLE IF NOT EXISTS ssc_bag_presence (
 bag_id uuid NOT NULL, slug text NOT NULL REFERENCES ssc_inventory(slug),
 expires_at timestamptz NOT NULL, PRIMARY KEY(bag_id,slug)
);
-- statement
CREATE INDEX IF NOT EXISTS ssc_presence_expiry ON ssc_bag_presence(expires_at);
-- statement
CREATE OR REPLACE FUNCTION ssc_reserve(p_id uuid,p_user text,p_hash text,p_slugs text[],p_payload jsonb,p_expires bigint)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE existing ssc_checkouts; result ssc_checkouts;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user,0));
 SELECT * INTO existing FROM ssc_checkouts WHERE user_id=p_user AND status IN ('creating','open') FOR UPDATE;
 IF FOUND THEN
  IF existing.cart_hash<>p_hash THEN RAISE EXCEPTION 'CHECKOUT_ALREADY_OPEN'; END IF;
  RETURN to_jsonb(existing);
 END IF;
 PERFORM 1 FROM ssc_inventory WHERE slug=ANY(p_slugs) ORDER BY slug FOR UPDATE;
 IF (SELECT count(*) FROM ssc_inventory WHERE slug=ANY(p_slugs) AND status='available')<>cardinality(p_slugs) THEN
  RAISE EXCEPTION 'CARD_UNAVAILABLE';
 END IF;
 INSERT INTO ssc_checkouts(id,user_id,cart_hash,slugs,payload,status,expires_at)
 VALUES(p_id,p_user,p_hash,p_slugs,p_payload,'creating',p_expires) RETURNING * INTO result;
 UPDATE ssc_inventory SET status='reserved',reservation_id=p_id WHERE slug=ANY(p_slugs);
 RETURN to_jsonb(result);
END $$;
-- statement
CREATE OR REPLACE FUNCTION ssc_settle(p_id uuid,p_session text,p_paid boolean)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE checkout ssc_checkouts;
BEGIN
 SELECT * INTO checkout FROM ssc_checkouts WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'missing'; END IF;
 IF checkout.session_id IS NOT NULL AND checkout.session_id<>p_session THEN RAISE EXCEPTION 'SESSION_MISMATCH'; END IF;
 IF checkout.status='paid' THEN RETURN 'paid'; END IF;
 IF checkout.status='released' THEN
  IF p_paid THEN RAISE EXCEPTION 'PAID_AFTER_RELEASE'; END IF;
  RETURN 'released';
 END IF;
 IF p_paid THEN
  UPDATE ssc_inventory SET status='sold',sold_session=p_session WHERE reservation_id=p_id AND status='reserved';
  UPDATE ssc_checkouts SET status='paid',session_id=p_session WHERE id=p_id;
  DELETE FROM ssc_bag_presence WHERE slug=ANY(checkout.slugs);
  RETURN 'paid';
 ELSE
  UPDATE ssc_inventory SET status='available',reservation_id=NULL WHERE reservation_id=p_id AND status='reserved';
  UPDATE ssc_checkouts SET status='released',session_id=p_session WHERE id=p_id;
  RETURN 'released';
 END IF;
END $$;
`;
