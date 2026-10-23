import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { SD_URL } from "@/config/site";
import { CATEGORIES } from "@/content/taxonomy";
import { getCompany, getPage } from "@/lib/data";
import { buildHit, recordHit } from "@/lib/hits";
import { pagePath, readToken } from "@/lib/links";
import { Template } from "@/templates";

type Params = { params: Promise<{ quarter: string; token: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ParentPage({ params }: Params) {
  return (
    <Suspense>
      <Resolved params={params} />
    </Suspense>
  );
}

/**
 * One request = one hit. The token was already verified by proxy.ts (invalid links never reach here);
 * it is decoded again for its context. Page content comes from the per-company cache, and the hit is
 * recorded after the response is sent.
 */
async function Resolved({ params }: Params) {
  const { quarter, token } = await params;
  const link = readToken(quarter, token);
  if (!link) redirect(SD_URL); // unreachable behind proxy.ts; kept so the page is safe on its own

  const page = await getPage(link.company, link.code);
  if (!page) notFound(); // dormant topic for this company

  // A page whose data check failed is blocked: it does not publish, so it is not a page and records no hit.
  if (page.tracking.reconStatus === "Mismatch (blocked)") notFound();

  const userAgent = (await headers()).get("user-agent");
  after(() => recordHit(buildHit("page", link, page, userAgent)));

  // C10 rotation links: same issue context, pointing at each peer's own C10 page.
  const company = page.template === "C10" ? await getCompany(link.company) : null;
  const peersWithC10 = new Set(
    company
      ? (await Promise.all(company.peers.map(getCompany))).filter((p) => p?.links.some((l) => l.code === "C10")).map((p) => p!.id)
      : [],
  );
  const peerHref = (id: string) =>
    peersWithC10.has(id) ? pagePath({ ...link, company: id, code: "C10", placement: "peer_rotation", ref: link.company }) : null;

  return (
    <PageShell
      company={page.company.name}
      sdHref={`/${quarter}/${token}/sd`}
      ga={{
        company: link.company,
        topic_code: link.code,
        template: page.template,
        cluster: page.cluster,
        product: link.product,
        platform: link.platform,
        placement: link.placement,
        issue: link.issue,
        quarter,
      }}
    >
      <title>{`${CATEGORIES[page.template].title} · ${page.company.name}`}</title>
      <Template page={page} links={{ peerHref }} today={new Date().toISOString().slice(0, 10)} />
    </PageShell>
  );
}
