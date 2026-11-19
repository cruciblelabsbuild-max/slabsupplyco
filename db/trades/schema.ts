import {shippingSchema} from "../shipping/schema";
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
${shippingSchema}
-- statement
CREATE OR REPLACE FUNCTION ssc_trade_apply(p_id uuid,p_owner text,p_actor text,p_action text,p_data jsonb,p_command uuid,p_revision integer) RETURNS text LANGUAGE plpgsql AS $$
DECLARE t ssc_trades_v3; o jsonb; next_state text; prior ssc_trade_events; amount integer;
BEGIN
 SELECT * INTO t FROM ssc_trades_v3 WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR (p_owner IS NOT NULL AND t.user_id<>p_owner) THEN RAISE EXCEPTION 'Trade not found.'; END IF;
 IF p_owner IS NOT NULL AND p_action NOT IN ('accept','decline_offer','info','submit','shipping_details') THEN RAISE EXCEPTION 'Not allowed.'; END IF;
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
  IF EXISTS(SELECT 1 FROM ssc_trade_shipping WHERE trade_id=p_id AND status IN ('creating','provider_created','unknown') AND direction='inbound') THEN RAISE EXCEPTION 'Shipping is already being created. Review the shipment before revising the offer.'; END IF;
  INSERT INTO ssc_trade_offers(id,trade_id,version,data) VALUES((p_data->>'id')::uuid,p_id,(p_data->>'version')::integer,p_data);
  UPDATE ssc_trades_v3 SET current_offer_id=(p_data->>'id')::uuid WHERE id=p_id;
  IF p_data->>'shippingApproved'='true' THEN INSERT INTO ssc_trade_shipping(id,trade_id,offer_id,direction,approved_at,approved_by,approval_details) VALUES(gen_random_uuid(),p_id,(p_data->>'id')::uuid,CASE WHEN p_data->>'kind'='inspection' THEN 'return' ELSE 'inbound' END,now(),p_actor,jsonb_build_object('source','offer','termsVerified',true,'approvedValueCents',(p_data->>'creditCents')::integer)) ON CONFLICT(trade_id,offer_id,direction) DO NOTHING; END IF;
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
 ELSIF p_action='approve_shipping' THEN
  IF p_data->>'direction'='return' THEN
   IF t.state NOT IN ('return_requested','revised_offer') THEN RAISE EXCEPTION 'A return decision or inspection revision is required.'; END IF;
   IF t.state='revised_offer' AND NOT EXISTS(SELECT 1 FROM ssc_trade_offers WHERE id=t.current_offer_id AND data->>'kind'='inspection') THEN RAISE EXCEPTION 'An inspection revision is required.'; END IF;
  ELSE
   IF t.state NOT IN ('offer_ready','revised_offer','awaiting_label') OR NOT EXISTS(SELECT 1 FROM ssc_trade_offers WHERE id=t.current_offer_id AND data->>'kind'='preliminary') THEN RAISE EXCEPTION 'A preliminary offer is required before shipping approval.'; END IF;
  END IF;
  IF p_data->>'termsVerified' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Verify the accepted shipping and return terms.'; END IF;
  IF EXISTS(SELECT 1 FROM ssc_trade_shipping WHERE trade_id=p_id AND offer_id=t.current_offer_id AND direction=p_data->>'direction' AND creation_started_at IS NOT NULL) THEN RAISE EXCEPTION 'Shipping is already being created. Review the existing label.'; END IF;
  INSERT INTO ssc_trade_shipping(id,trade_id,offer_id,direction,approved_at,approved_by,approval_details,card_count) VALUES(gen_random_uuid(),p_id,t.current_offer_id,p_data->>'direction',now(),p_actor,p_data,(p_data->>'cardCount')::integer) ON CONFLICT(trade_id,offer_id,direction) DO UPDATE SET approved_at=coalesce(ssc_trade_shipping.approved_at,excluded.approved_at),approved_by=coalesce(ssc_trade_shipping.approved_by,excluded.approved_by),approval_details=excluded.approval_details,card_count=coalesce(excluded.card_count,ssc_trade_shipping.card_count),updated_at=now();
 ELSIF p_action='shipping_details' THEN
  IF t.state NOT IN ('awaiting_label','return_requested') OR t.accepted_offer_id IS NULL THEN RAISE EXCEPTION 'An accepted offer is required before confirming shipping details.'; END IF;
  IF EXISTS(SELECT 1 FROM ssc_trade_shipping WHERE trade_id=p_id AND offer_id=t.current_offer_id AND status IN ('creating','provider_created','unknown','label_created','in_transit','delivered')) THEN RAISE EXCEPTION 'Shipping is already being created. Contact the trade desk before changing the address.'; END IF;
  INSERT INTO ssc_trade_shipping(id,trade_id,offer_id,direction,card_count,address) VALUES(gen_random_uuid(),p_id,t.current_offer_id,CASE WHEN t.state='return_requested' THEN 'return' ELSE 'inbound' END,(p_data->>'cardCount')::integer,p_data->'address') ON CONFLICT(trade_id,offer_id,direction) DO UPDATE SET card_count=excluded.card_count,address=excluded.address,status='pending',reason_code=NULL,reason=NULL,updated_at=now();
 ELSIF p_action='request_info' THEN
  IF t.state NOT IN ('submitted','reviewing','more_info','legacy_quoted') THEN RAISE EXCEPTION 'Information cannot be requested at this stage.'; END IF;next_state:='more_info';
 ELSIF p_action='info' THEN
  IF t.state<>'more_info' THEN RAISE EXCEPTION 'No information request is open.'; END IF;next_state:='reviewing';
 ELSIF p_action='label' THEN
  IF EXISTS(SELECT 1 FROM ssc_trade_shipping WHERE trade_id=p_id AND direction='inbound' AND creation_started_at IS NOT NULL AND status NOT IN ('voided','superseded')) THEN RAISE EXCEPTION 'Automatic shipping has already started. Reconcile it before a manual replacement.'; END IF;
  IF t.state NOT IN ('awaiting_label','awaiting_shipment') OR t.accepted_offer_id IS NULL THEN RAISE EXCEPTION 'Accept an offer before attaching a label.'; END IF;
  IF p_data->>'offerId'<>t.accepted_offer_id::text THEN RAISE EXCEPTION 'Label must match the accepted offer.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM ssc_trade_files WHERE id=(p_data->>'fileId')::uuid AND trade_id=p_id) THEN RAISE EXCEPTION 'Label file must belong to this trade.'; END IF;
  INSERT INTO ssc_trade_labels(id,trade_id,file_id,direction,data) VALUES((p_data->>'id')::uuid,p_id,(p_data->>'fileId')::uuid,'inbound',p_data);
  next_state:='awaiting_shipment';
 ELSIF p_action='return_label' THEN
  IF EXISTS(SELECT 1 FROM ssc_trade_shipping WHERE trade_id=p_id AND direction='return' AND creation_started_at IS NOT NULL AND status NOT IN ('voided','superseded')) THEN RAISE EXCEPTION 'Automatic return shipping has already started. Reconcile it before a manual replacement.'; END IF;
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
  IF p_data->>'shippingApproved'='true' THEN INSERT INTO ssc_trade_shipping(id,trade_id,offer_id,direction,approved_at,approved_by,approval_details) VALUES(gen_random_uuid(),p_id,t.current_offer_id,'return',now(),p_actor,jsonb_build_object('source','inspection_decline','termsVerified',true)) ON CONFLICT(trade_id,offer_id,direction) DO NOTHING; END IF;
 ELSIF p_action='stage' THEN
  next_state:=p_data->>'state';
  IF NOT ((t.state='submitted' AND next_state='reviewing') OR (t.state='awaiting_shipment' AND next_state='in_transit') OR (t.state='in_transit' AND next_state='delivered') OR (t.state IN ('in_transit','delivered') AND next_state='received') OR (t.state='received' AND next_state='inspecting') OR (t.state='return_label' AND next_state='return_shipped') OR (t.state='return_shipped' AND next_state='returned')) THEN RAISE EXCEPTION 'That stage does not follow the current trade status.'; END IF;
 ELSE RAISE EXCEPTION 'Unknown trade action.'; END IF;
 UPDATE ssc_trades_v3 SET state=next_state,revision=revision+1,updated_at=now() WHERE id=p_id;
 INSERT INTO ssc_trade_events(trade_id,command_id,actor,action,data) VALUES(p_id,p_command,p_actor,p_action,p_data);
 RETURN next_state;
END $$;
`;
