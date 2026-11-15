import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const waitlistEntries = sqliteTable("waitlist_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  email: text("email").notNull().unique(),
  interest: text("interest").notNull(),
  collectingFocus: text("collecting_focus").notNull().default(""),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by").notNull().default(""),
  utmSource: text("utm_source").notNull().default(""),
  utmMedium: text("utm_medium").notNull().default(""),
  utmCampaign: text("utm_campaign").notNull().default(""),
  ipHash: text("ip_hash").notNull(),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tradeInInterests = sqliteTable("trade_in_interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  grader: text("grader").notNull(),
  estimatedValue: text("estimated_value").notNull(),
  timeframe: text("timeframe").notNull(),
  cardDetails: text("card_details").notNull(),
  ipHash: text("ip_hash").notNull(),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventName: text("event_name").notNull(),
  sessionId: text("session_id").notNull(),
  path: text("path").notNull(),
  metadata: text("metadata").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
