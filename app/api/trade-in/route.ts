import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { tradeInInterests } from "../../../db/schema";
import { asText, cutoffSqlDate, ipFingerprint, isEmail, json, validFormTiming } from "../../../lib/form-utils";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 16_000) return json({ message: "That submission is too large." }, 413);
    const body = await request.json() as Record<string, unknown>;
    if (asText(body.company, 80)) return json({ message: "Your trade-in interest is saved." });

    const firstName = asText(body.firstName, 60);
    const email = asText(body.email, 160).toLowerCase();
    const grader = asText(body.grader, 40);
    const estimatedValue = asText(body.estimatedValue, 40);
    const timeframe = asText(body.timeframe, 80);
    const cardDetails = asText(body.cardDetails, 1200);
    const consent = body.consent === true;
    if (!firstName || !isEmail(email) || !grader || !estimatedValue || !timeframe || cardDetails.length < 12 || !consent) {
      return json({ message: "Please complete the required fields and confirm email consent." }, 400);
    }
    if (!validFormTiming(body.startedAt)) return json({ message: "Please wait a moment and submit again." }, 429);

    const db = getDb();
    const ipHash = await ipFingerprint(request);
    const recent = await db.select({ count: sql<number>`count(*)` }).from(tradeInInterests).where(and(eq(tradeInInterests.ipHash, ipHash), gte(tradeInInterests.createdAt, cutoffSqlDate(24))));
    if (Number(recent[0]?.count || 0) >= 5) return json({ message: "Too many recent submissions. Please try again tomorrow." }, 429);

    await db.insert(tradeInInterests).values({ firstName, email, grader, estimatedValue, timeframe, cardDetails, ipHash, consent });
    return json({ message: "We saved your interest. We’ll reach out when trade-in reviews open." }, 201);
  } catch (error) {
    console.error("trade-in submission failed", error);
    return json({ message: "We couldn’t save your submission just now. Please try again." }, 500);
  }
}
