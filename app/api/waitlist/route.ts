import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { waitlistEntries } from "../../../db/schema";
import { asText, cutoffSqlDate, ipFingerprint, isEmail, json, referralCode, validFormTiming } from "../../../lib/form-utils";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 12_000) return json({ message: "That submission is too large." }, 413);
    const body = await request.json() as Record<string, unknown>;
    if (asText(body.company, 80)) return json({ message: "You’re on the early-access list." });

    const firstName = asText(body.firstName, 60);
    const email = asText(body.email, 160).toLowerCase();
    const interest = asText(body.interest, 20);
    const collectingFocus = asText(body.collectingFocus, 160);
    const consent = body.consent === true;
    if (!firstName || !isEmail(email) || !new Set(["buying", "trading", "both"]).has(interest) || !consent) {
      return json({ message: "Please complete the required fields and confirm email consent." }, 400);
    }
    if (!validFormTiming(body.startedAt)) return json({ message: "Please wait a moment and submit again." }, 429);

    const db = getDb();
    const existing = await db.select({ referralCode: waitlistEntries.referralCode }).from(waitlistEntries).where(eq(waitlistEntries.email, email)).limit(1);
    if (existing[0]) return json({ message: "You’re already on the list—we kept your original spot.", referralUrl: `${new URL(request.url).origin}/?ref=${existing[0].referralCode}` });

    const ipHash = await ipFingerprint(request);
    const recent = await db.select({ count: sql<number>`count(*)` }).from(waitlistEntries).where(and(eq(waitlistEntries.ipHash, ipHash), gte(waitlistEntries.createdAt, cutoffSqlDate(1))));
    if (Number(recent[0]?.count || 0) >= 8) return json({ message: "Too many recent submissions. Please try again later." }, 429);

    const code = referralCode();
    await db.insert(waitlistEntries).values({
      firstName, email, interest, collectingFocus, referralCode: code,
      referredBy: asText(body.referredBy, 16).toUpperCase(),
      utmSource: asText(body.utmSource, 100),
      utmMedium: asText(body.utmMedium, 100),
      utmCampaign: asText(body.utmCampaign, 100),
      ipHash, consent,
    });
    return json({ message: "Your early-access spot is saved. We’ll keep updates useful and infrequent.", referralUrl: `${new URL(request.url).origin}/?ref=${code}` }, 201);
  } catch (error) {
    console.error("waitlist submission failed", error);
    return json({ message: "We couldn’t save your spot just now. Please try again." }, 500);
  }
}
