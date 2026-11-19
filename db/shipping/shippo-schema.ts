export const shippoSchema=`
CREATE TABLE IF NOT EXISTS ssc_order_shipping(
 id uuid PRIMARY KEY,checkout_id uuid NOT NULL UNIQUE REFERENCES ssc_checkouts(id),session_id text NOT NULL UNIQUE,user_id text NOT NULL,
 approved_at timestamptz,approved_by text,status text NOT NULL DEFAULT 'awaiting_approval',reason_code text,reason text,
 address jsonb NOT NULL,card_count integer NOT NULL,value_cents integer NOT NULL,plan jsonb,provider_result jsonb,
 environment text,creation_started_at timestamptz,lease_at timestamptz,label_contents bytea,tracking jsonb NOT NULL DEFAULT '[]',updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement
ALTER TABLE ssc_trade_shipping ADD COLUMN IF NOT EXISTS attempt_reference text;
-- statement
ALTER TABLE ssc_order_shipping ADD COLUMN IF NOT EXISTS attempt_reference text;
-- statement
CREATE TABLE IF NOT EXISTS ssc_shipping_events(id bigserial PRIMARY KEY,job_id uuid NOT NULL,kind text NOT NULL,event_key text NOT NULL UNIQUE,data jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
-- statement
CREATE TABLE IF NOT EXISTS ssc_shipping_webhooks(event_key text PRIMARY KEY,mode text NOT NULL,event text NOT NULL,transaction_id text,tracking text,carrier text,reference text,processed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
-- statement
CREATE INDEX IF NOT EXISTS ssc_order_shipping_queue ON ssc_order_shipping(status,updated_at);
`;
