import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

export function getDb() {
  return drizzle(async (sql, params, method) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
    const token = process.env.CLOUDFLARE_D1_API_TOKEN;
    if (!accountId || !databaseId || !token) {
      throw new Error("Configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_API_TOKEN in Vercel to enable database-backed forms.");
    }
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/raw`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sql, params }),
        cache: "no-store",
      },
    );
    const body = await response.json() as {
      success: boolean;
      result?: { success: boolean; results: { rows: unknown[][] } }[];
    };
    const result = body.result?.[0];
    if (!response.ok || !body.success || !result?.success) {
      throw new Error("D1 database query failed.");
    }
    const rows = result.results.rows;
    return { rows: method === "get" ? rows[0] : rows };
  }, { schema });
}
