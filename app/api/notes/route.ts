import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { siteNotes } from "../../../db/schema";
import { asText, cutoffSqlDate, ipFingerprint, isEmail, json, validFormTiming } from "../../../lib/form-utils";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 12_000) return json({ message: "That note is too large." }, 413);
    const body = await request.json() as Record<string, unknown>;
    if (asText(body.company, 80)) return json({ message: "Thanks—your note is on its way." });

    const firstName = asText(body.firstName, 60);
    const email = asText(body.email, 160).toLowerCase();
    const message = asText(body.message, 1600);
    const consent = body.consent === true;
    if (!firstName || !isEmail(email) || message.length < 8 || !consent) {
      return json({ message: "Please complete the required fields and confirm email consent." }, 400);
    }
    if (!validFormTiming(body.startedAt)) return json({ message: "Please wait a moment and submit again." }, 429);

    const db = getDb();
    const ipHash = await ipFingerprint(request);
    const recent = await db.select({ count: sql<number>`count(*)` }).from(siteNotes).where(and(eq(siteNotes.ipHash, ipHash), gte(siteNotes.createdAt, cutoffSqlDate(24))));
    if (Number(recent[0]?.count || 0) >= 5) return json({ message: "Too many recent notes. Please try again tomorrow." }, 429);

    await db.insert(siteNotes).values({ firstName, email, message, ipHash, consent });
    return json({ message: "Thanks—your note is on its way." }, 201);
  } catch (error) {
    console.error("note submission failed", error);
    return json({ message: "We couldn’t send your note just now. Please try again." }, 500);
  }
}
