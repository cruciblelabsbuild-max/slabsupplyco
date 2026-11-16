export const tradeSchema=`
CREATE TABLE IF NOT EXISTS ssc_trades_v3(id uuid PRIMARY KEY,user_id text NOT NULL,state text NOT NULL DEFAULT 'draft',revision integer NOT NULL DEFAULT 0,submission jsonb NOT NULL DEFAULT '{}',current_offer_id uuid,accepted_offer_id uuid,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
-- statement
CREATE INDEX IF NOT EXISTS ssc_trades_owner ON ssc_trades_v3(user_id,created_at DESC);
-- statement
CREATE TABLE IF NOT EXISTS ssc_trade_offers(id uuid PRIMARY KEY,trade_id uuid NOT NULL REFERENCES ssc_trades_v3(id),version integer NOT NULL,data jsonb NOT NULL,UNIQUE(trade_id,version));
-- statement
CREATE TABLE IF NOT EXISTS ssc_trade_files(id uuid PRIMARY KEY,trade_id uuid NOT NULL REFERENCES ssc_trades_v3(id),name text NOT NULL,mime text NOT NULL,size integer NOT NULL,kind text NOT NULL,card_key text,contents bytea NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
-- statement
CREATE TABLE IF NOT EXISTS ssc_trade_labels(id uuid PRIMARY KEY,trade_id uuid NOT NULL REFERENCES ssc_trades_v3(id),file_id uuid NOT NULL REFERENCES ssc_trade_files(id),direction text NOT NULL,data jsonb NOT NULL);
-- statement
CREATE TABLE IF NOT EXISTS ssc_trade_events(id bigserial PRIMARY KEY,trade_id uuid NOT NULL REFERENCES ssc_trades_v3(id),command_id uuid NOT NULL UNIQUE,actor text NOT NULL,action text NOT NULL,data jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
-- statement
CREATE TABLE IF NOT EXISTS ssc_trade_credit(id uuid PRIMARY KEY,trade_id uuid NOT NULL UNIQUE REFERENCES ssc_trades_v3(id),user_id text NOT NULL,amount_cents integer NOT NULL CHECK(amount_cents>0),currency text NOT NULL DEFAULT 'usd',status text NOT NULL DEFAULT 'posted',created_at timestamptz NOT NULL DEFAULT now());
-- statement
CREATE OR REPLACE FUNCTION ssc_trade_apply(p_id uuid,p_owner text,p_actor text,p_action text,p_data jsonb,p_command uuid,p_revision integer) RETURNS text LANGUAGE plpgsql AS $$
DECLARE t ssc_trades_v3; o jsonb; next_state text; prior ssc_trade_events; amount integer;
BEGIN
 SELECT * INTO t FROM ssc_trades_v3 WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR (p_owner IS NOT NULL AND t.user_id<>p_owner) THEN RAISE EXCEPTION 'Trade not found.'; END IF;
 IF p_owner IS NOT NULL AND p_action NOT IN ('accept','decline_offer','info','submit') THEN RAISE EXCEPTION 'Not allowed.'; END IF;
 SELECT * INTO prior FROM ssc_trade_events WHERE command_id=p_command;
 IF FOUND THEN
  IF prior.trade_id=p_id AND prior.actor=p_actor AND prior.action=p_action AND prior.data=p_data THEN RETURN t.state; END IF;
  RAISE EXCEPTION 'Request already used.';
 END IF;
 IF p_action='issue_credit' AND t.state='credit_issued' THEN RETURN t.state; END IF;
 IF t.revision<>p_revision THEN RAISE EXCEPTION 'This trade changed. Refresh before continuing.'; END IF;
 next_state:=t.state;
 IF p_action='submit' THEN
  IF t.state<>'draft' THEN RAISE EXCEPTION 'This trade has already been submitted.'; END IF;
  UPDATE ssc_trades_v3 SET submission=p_data->'submission' WHERE id=p_id;next_state:='submitted';
 ELSIF p_action='offer' THEN
  IF t.state NOT IN ('submitted','reviewing','more_info','offer_ready','legacy_quoted','awaiting_label','revised_offer','received','inspecting') THEN RAISE EXCEPTION 'An offer cannot be issued at this stage.'; END IF;
  IF p_data->>'kind'='inspection' AND t.state NOT IN ('received','inspecting','revised_offer') THEN RAISE EXCEPTION 'Receive and inspect the shipment before revising the inspection offer.'; END IF;
  IF t.state IN ('received','inspecting') AND p_data->>'kind'<>'inspection' THEN RAISE EXCEPTION 'An inspection revision is required.'; END IF;
  IF (p_data->>'version')::integer<>(SELECT coalesce(max(version),0)+1 FROM ssc_trade_offers WHERE trade_id=p_id) THEN RAISE EXCEPTION 'Offer version changed. Refresh before continuing.'; END IF;
  INSERT INTO ssc_trade_offers(id,trade_id,version,data) VALUES((p_data->>'id')::uuid,p_id,(p_data->>'version')::integer,p_data);
  UPDATE ssc_trades_v3 SET current_offer_id=(p_data->>'id')::uuid WHERE id=p_id;
  next_state:=CASE WHEN t.accepted_offer_id IS NOT NULL THEN 'revised_offer' ELSE 'offer_ready' END;
 ELSIF p_action IN ('accept','decline_offer') THEN
  IF t.state NOT IN ('offer_ready','revised_offer') OR t.current_offer_id::text<>p_data->>'offerId' THEN RAISE EXCEPTION 'This offer is no longer current.'; END IF;
  SELECT data INTO o FROM ssc_trade_offers WHERE id=t.current_offer_id AND trade_id=p_id;
  IF p_action='accept' THEN
   IF p_data->>'consent' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Accept the shipping, inspection and return terms.'; END IF;
   IF o->>'expiresAt' IS NOT NULL AND (o->>'expiresAt')::timestamptz<=now() THEN RAISE EXCEPTION 'This offer has expired. Request an updated offer.'; END IF;
   UPDATE ssc_trades_v3 SET accepted_offer_id=t.current_offer_id WHERE id=p_id;
   next_state:=CASE WHEN o->>'kind'='inspection' THEN 'ready_credit' ELSE 'awaiting_label' END;
  ELSE next_state:=CASE WHEN o->>'kind'='inspection' THEN 'return_requested' ELSE 'declined' END; END IF;
 ELSIF p_action='request_info' THEN
  IF t.state NOT IN ('submitted','reviewing','more_info','legacy_quoted') THEN RAISE EXCEPTION 'Information cannot be requested at this stage.'; END IF;next_state:='more_info';
 ELSIF p_action='info' THEN
  IF t.state<>'more_info' THEN RAISE EXCEPTION 'No information request is open.'; END IF;next_state:='reviewing';
 ELSIF p_action='label' THEN
  IF t.state NOT IN ('awaiting_label','awaiting_shipment') OR t.accepted_offer_id IS NULL THEN RAISE EXCEPTION 'Accept an offer before attaching a label.'; END IF;
  IF p_data->>'offerId'<>t.accepted_offer_id::text THEN RAISE EXCEPTION 'Label must match the accepted offer.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM ssc_trade_files WHERE id=(p_data->>'fileId')::uuid AND trade_id=p_id) THEN RAISE EXCEPTION 'Label file must belong to this trade.'; END IF;
  INSERT INTO ssc_trade_labels(id,trade_id,file_id,direction,data) VALUES((p_data->>'id')::uuid,p_id,(p_data->>'fileId')::uuid,'inbound',p_data);
  next_state:='awaiting_shipment';
 ELSIF p_action='return_label' THEN
  IF t.state NOT IN ('return_requested','return_label') THEN RAISE EXCEPTION 'A return must be requested first.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM ssc_trade_files WHERE id=(p_data->>'fileId')::uuid AND trade_id=p_id) THEN RAISE EXCEPTION 'Label file must belong to this trade.'; END IF;
  INSERT INTO ssc_trade_labels(id,trade_id,file_id,direction,data) VALUES((p_data->>'id')::uuid,p_id,(p_data->>'fileId')::uuid,'return',p_data);next_state:='return_label';
 ELSIF p_action='inspect_confirm' THEN
  IF t.state NOT IN ('received','inspecting') OR t.accepted_offer_id IS NULL THEN RAISE EXCEPTION 'Receive the cards before approving inspection.'; END IF;next_state:='ready_credit';
 ELSIF p_action='issue_credit' THEN
  IF t.state<>'ready_credit' OR t.accepted_offer_id IS NULL OR t.current_offer_id<>t.accepted_offer_id THEN RAISE EXCEPTION 'Final inspection and current offer approval are required.'; END IF;
  SELECT (data->>'creditCents')::integer INTO amount FROM ssc_trade_offers WHERE id=t.accepted_offer_id AND trade_id=p_id;
  INSERT INTO ssc_trade_credit(id,trade_id,user_id,amount_cents) VALUES(p_command,p_id,t.user_id,amount) ON CONFLICT(trade_id) DO NOTHING;next_state:='credit_issued';
 ELSIF p_action='decline' THEN
  IF t.accepted_offer_id IS NOT NULL OR t.state NOT IN ('submitted','reviewing','more_info','offer_ready','legacy_quoted') THEN RAISE EXCEPTION 'Use the return workflow for accepted cards.'; END IF;next_state:='declined';
 ELSIF p_action='inspection_decline' THEN
  IF t.state NOT IN ('received','inspecting','revised_offer') OR (t.state='revised_offer' AND NOT EXISTS(SELECT 1 FROM ssc_trade_offers WHERE id=t.current_offer_id AND data->>'kind'='inspection')) THEN RAISE EXCEPTION 'Cards must be received before an inspection decline.'; END IF;next_state:='return_requested';
 ELSIF p_action='stage' THEN
  next_state:=p_data->>'state';
  IF NOT ((t.state='submitted' AND next_state='reviewing') OR (t.state='awaiting_shipment' AND next_state='in_transit') OR (t.state='in_transit' AND next_state='delivered') OR (t.state IN ('in_transit','delivered') AND next_state='received') OR (t.state='received' AND next_state='inspecting') OR (t.state='return_label' AND next_state='return_shipped') OR (t.state='return_shipped' AND next_state='returned')) THEN RAISE EXCEPTION 'That stage does not follow the current trade status.'; END IF;
 ELSE RAISE EXCEPTION 'Unknown trade action.'; END IF;
 UPDATE ssc_trades_v3 SET state=next_state,revision=revision+1,updated_at=now() WHERE id=p_id;
 INSERT INTO ssc_trade_events(trade_id,command_id,actor,action,data) VALUES(p_id,p_command,p_actor,p_action,p_data);
 RETURN next_state;
END $$;
`;
