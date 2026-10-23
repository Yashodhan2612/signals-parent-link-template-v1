/**
 * Hit capture (pillar 2): every parent-page open and every StockDashboard click is recorded
 * server-side, after the response is sent, so capture never slows the page and works without JS.
 *
 * Sink:
 *   HITS_ENDPOINT set  -> POST one JSON hit to the BST-DB ingestion endpoint.
 *   otherwise (dev / SIGNALS_PREVIEW) -> a bounded in-memory log, readable at GET /api/hits.
 *
 * Bot filtering and the suspect flag are applied downstream (kickoff §9), which is why the
 * user agent is passed through. No IP address or other personal data is recorded.
 */
import type { LinkContext } from "./links";
import type { Cluster, TemplateCode } from "@/content/taxonomy";
import type { PageContent, ReconStatus } from "@/content/types";

export type Hit = LinkContext & {
  /** page = parent page opened; sd = StockDashboard section clicked. */
  kind: "page" | "sd";
  template: TemplateCode;
  cluster: Cluster;
  /** Weeks since the page content last changed (workbook "Apple v2", row 3). */
  weeksSinceChange: number | null;
  /** Logged with every click so a change can be traced to the page, the data behind it, or demand (templates v1.3, Block 0). */
  templateVersion: string;
  dataSnapshotId: string;
  reconStatus: ReconStatus;
  reconStatusSetOn: string;
  userAgent: string | null;
  at: string;
};

const ENDPOINT = process.env.HITS_ENDPOINT;
const LOCAL_LIMIT = 10_000;

const store = globalThis as typeof globalThis & { __signalHits?: Hit[] };
const local = (store.__signalHits ??= []);

const weeksSince = (iso: string | undefined, now = Date.now()) =>
  iso ? Math.max(0, Math.floor((now - Date.parse(iso)) / (7 * 864e5))) : null;

/** The hit for one click on a page, with the page's tracking fields attached. */
export function buildHit(kind: Hit["kind"], link: LinkContext, page: PageContent, userAgent: string | null): Hit {
  return {
    ...link,
    kind,
    template: page.template,
    cluster: page.cluster,
    weeksSinceChange: weeksSince(page.contentChangedOn),
    ...page.tracking,
    userAgent,
    at: new Date().toISOString(),
  };
}

export async function recordHit(hit: Hit): Promise<void> {
  if (!ENDPOINT) {
    local.push(hit);
    if (local.length > LOCAL_LIMIT) local.splice(0, local.length - LOCAL_LIMIT);
    console.log(`[hit] ${hit.kind} ${hit.company} ${hit.code} ${hit.product}/${hit.platform}/${hit.placement} issue=${hit.issue}`);
    return;
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(hit),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.error(`[hit] sink responded ${res.status}`);
  } catch (err) {
    // Never fail the reader's request over analytics; the error is visible in server logs.
    console.error("[hit] sink unreachable", err);
  }
}

/** Local log, newest last. Only used by the preview hit viewer. */
export const localHits = (): readonly Hit[] => local;
