// Public browsing must not require a Clerk development-browser handshake.
// Requests carrying auth state still go through Clerk, including OAuth returns.
const publicPages = new Set(["/", "/membership", "/membership/terms", "/promise", "/help", "/privacy", "/terms", "/join", "/shop", "/drops", "/trade-ins", "/robots.txt", "/sitemap.xml", "/api/inventory", "/checkout"]);
export const publicGuestHeader = "x-ssc-public-guest";
export function isPublicGuestRequest(request: Pick<Request,"url"|"headers"|"method">) {
 const url = new URL(request.url);
 if (!["GET","HEAD"].includes(request.method) || !publicPages.has(url.pathname)) return false;
 if (request.headers.has("authorization")) return false;
 if ([...url.searchParams.keys()].some(key=>key.startsWith("__clerk") || key==="redirect_url")) return false;
 const cookies=(request.headers.get("cookie")||"").split(";").map(value=>value.trim().split("=",1)[0]);
 return !cookies.some(name=>name.startsWith("__session") || name.startsWith("__client_uat") || name.startsWith("__clerk"));
}
