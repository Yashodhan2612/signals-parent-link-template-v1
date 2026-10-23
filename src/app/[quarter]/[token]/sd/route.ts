import { after, NextResponse } from "next/server";
import { SD_URL } from "@/config/site";
import { getPage } from "@/lib/data";
import { buildHit, recordHit } from "@/lib/hits";
import { readToken } from "@/lib/links";

/**
 * The StockDashboard section's own tracked, dynamic link: unique per issue because it hangs off the
 * parent page's token. Records the click, then sends the reader on. Only UTM tags travel to
 * StockDashboard; the token and the hidden page URL never do.
 */
export async function GET(request: Request, { params }: { params: Promise<{ quarter: string; token: string }> }) {
  const { quarter, token } = await params;
  const link = readToken(quarter, token);
  const target = new URL(SD_URL);
  if (link) {
    target.searchParams.set("utm_source", "greenwich_signals");
    target.searchParams.set("utm_medium", link.product);
    target.searchParams.set("utm_campaign", link.code);
    const page = await getPage(link.company, link.code);
    const userAgent = request.headers.get("user-agent");
    if (page) after(() => recordHit(buildHit("sd", link, page, userAgent)));
  }
  const res = NextResponse.redirect(target, 302);
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
