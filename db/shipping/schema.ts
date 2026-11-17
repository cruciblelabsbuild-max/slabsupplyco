export const shippingSchema=`
CREATE TABLE IF NOT EXISTS ssc_trade_shipping(id uuid PRIMARY KEY,trade_id uuid NOT NULL REFERENCES ssc_trades_v3(id),offer_id uuid NOT NULL REFERENCES ssc_trade_offers(id),direction text NOT NULL CHECK(direction IN ('inbound','return')),approved_at timestamptz,approved_by text,approval_details jsonb NOT NULL DEFAULT '{}',status text NOT NULL DEFAULT 'awaiting_approval',reason_code text,reason text,card_count integer,address jsonb,plan jsonb,provider_result jsonb,environment text,creation_started_at timestamptz,lease_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(trade_id,offer_id,direction));
-- statement
CREATE TABLE IF NOT EXISTS ssc_trade_tracking(id bigserial PRIMARY KEY,shipment_id uuid NOT NULL REFERENCES ssc_trade_shipping(id),tracking text NOT NULL,event_key text NOT NULL,data jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(shipment_id,tracking,event_key));
-- statement
CREATE INDEX IF NOT EXISTS ssc_trade_shipping_work ON ssc_trade_shipping(status,updated_at);
`;
