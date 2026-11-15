import { getDb } from "../../../db";
import { analyticsEvents } from "../../../db/schema";
import { asText, json } from "../../../lib/form-utils";

const allowedEvents = new Set(["page_view", "waitlist_started", "waitlist_submitted", "tradein_started", "tradein_submitted", "faq_opened", "share_copied", "shelf_interest"]);

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 8_000) return json({ ok: false }, 413);
    const body = await request.json() as Record<string, unknown>;
    const eventName = asText(body.event, 40);
    const sessionId = asText(body.sessionId, 80);
    const path = asText(body.path, 160);
    if (!allowedEvents.has(eventName) || !sessionId || !path) return json({ ok: false }, 400);
    await getDb().insert(analyticsEvents).values({ eventName, sessionId, path, metadata: JSON.stringify(body.metadata ?? {}).slice(0, 3000) });
    return json({ ok: true }, 201);
  } catch {
    return json({ ok: false }, 400);
  }
}
