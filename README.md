# Readership Signals: parent page templates (Live)

The parent pages behind the tracked links in BST reports, branded **Greenwich Research News Data**.
This repo holds all eleven core category templates (C01 to C11), the link format, and hit capture.

| Code | Category | Layout family | Exhibit |
|---|---|---|---|
| C01 | Revenue Mix | Standard (workbook "Example page") | 8-quarter table |
| C02 | Margins and What Moves Them | Exhibit first | Line chart, three series, spread shaded |
| C03 | Debt and Balance Sheet | Two exhibits, two as-of dates | Quarterly debt and cash table, then the annual maturity ladder |
| C04 | Capital Returns and Share Count | Standard | One table, eight quarters, the last column answers the question |
| C05 | Capex and Committed Spend | Two exhibits, two as-of dates | Capex table, then commitments bar |
| C06 | Guidance Record | List, no figures strip | Register grouped by quarter, state tag plus movement |
| C07 | Legal and Regulatory Docket | List, no figures strip | Matter register |
| C08 | Ownership and Insider Activity | Two exhibits, two as-of dates, phased | Holders table per share class, then the insider log |
| C09 | Corporate Actions Record | List, no figures strip, phased | 24-month register, fixed six-type list |
| C10 | Peer Ranking and Rotation | Comparison, exhibit-led | Ranking matrix plus tracked peer links |
| C11 | Coverage and Attention | Weekly list, generated | Topic table: stories this week against the 12-week median |

Sources of truth: *Readership Signals: Live Project Document* (13 Oct 2026), *Parent Page Templates*
(Kartik; C01, C02, C05, C07, C10 from the 15 Oct document, C03, C04, C06, C08, C09, C11 from v1.3 of 21 Oct 2026)
and the v2 workbook (*Core topics*, *Apple v2*, *Example page* tabs).
**All company-specific content is lorem ipsum.** Every place real content goes is a typed field in
`src/content/types.ts`.

```bash
npm install
cp .env.example .env.local     # SIGNALS_PREVIEW=1 for local review
npm run dev                    # http://localhost:3300  menu with a working link to each template
npm run check:all              # typecheck + content rules + link round-trip and 2,90,400-link volume test
```

---

## How it works, end to end

```
report issue ──► link block: one link per live topic, text = the promise line
                    │   /{quarter}/{token}            token = signed link context, nothing stored
                    ▼
proxy.ts          verify token (one HMAC). Invalid or other quarter ──► 307 to stockdashboard.com
                    ▼
[quarter]/[token] decode context ─► getPage(company, code)  (cached per company, "use cache")
                    │                       └── content source: lorem today, BST DB via pillar 1
                    ├─► render the category template (S12-S15 use their cluster's template)
                    └─► after(): recordHit(kind "page")  ──► HITS_ENDPOINT (BST-DB) or local log
                    
page links:       StockDashboard section ─► /{quarter}/{token}/sd ─► recordHit(kind "sd") ─► 302 out
                  C10 peers ─► new token for the peer's C10, placement "peer_rotation", ref = this company
GA4 mirror:       parent_open and sd_click, client-side, same context (optional)
```

**Why it scales.** Link volume (66 issues × 50 companies × 11-15 topics × 2 platforms × 4 products ≈ 2,90,400+
links per quarter, about double with StockDashboard links) costs nothing: a link is its own signed context, so
there is no link table to write, store, index or look up. Serving a link is one HMAC plus a cached content read.
Pages are cached per company and topic, not per link, so the content store sees one read per page per refresh,
whatever the link count. `npm run check:tracking` mints and verifies a full quarter in about a second, with
**0 bytes stored**, which is also the answer to the "testing 2 lakh+ links locally" roadblock.

---

## Suryansh: what to build next

### 1. Content ingestion (pillar 1)
- Implement `ContentSource` (`src/content/source.ts`) against the BST database and export it as `source`
  in place of `loremSource`. Nothing else changes.
- The agent fills exactly the fields in `src/content/types.ts`. Titles, column headers, metric lists, due-period
  buckets and refresh triggers are fixed in the templates and `src/content/taxonomy.ts`, so the agent cannot
  change a page's shape.
- Company records (`Company`) list each company's live links in slot order. S12-S15 links name the core
  template they reuse; it must be a template from the S link's cluster (for example S12 Greater China revenue →
  `C01`, Operating performance). A topic with no content is simply left out (dormant).
- After writing a company, call `POST /api/revalidate` `{ "company": "<id>" }` with header
  `x-revalidate-secret: $REVALIDATE_SECRET`. Links are unaffected.
- Run `npm run check:content` before content goes live: 3-5 bullets under 25 words, 40-80 words in How to read it,
  3-5 figures, 8 quarters, 7 peers, slot order, valid source references, and so on.

### 2. Dynamic links (pillars 2 and 3)
- Mint with `mintToken` / `pagePath` in `src/lib/links.ts`. Context: `quarter`, `product`
  (`dsr`, `mini_dsr`, `day_ahead_dsr`, `peer_story`), `issue`, `company`, `code`, `platform`
  (`lexisnexis`, `lseg`), `placement` (`block`, `in_text`; `peer_rotation` is minted by C10 itself).
- A new issue = a new `issue` value = a new URL, even with unchanged content.
- Quarter rollover = a new `quarter` path segment and a new derived signing key. Old links keep working forever
  under their own quarter.
- Set `LINK_SECRET` (long random string) in production and never rotate it: changing it invalidates every
  published link.
- The report link text is `linkText`: the first four to seven words of the page's `promise`, verbatim (templates v1.3,
  Block 1). If you change either, change both before launch. `npm run check:content` enforces it.

### 3. Hit capture into BST-DB (pillar 2)
- Every page open and StockDashboard click is recorded server-side by `recordHit` (`src/lib/hits.ts`), after the
  response, so it never slows the page and works without JavaScript. Set `HITS_ENDPOINT` to the BST-DB ingestion
  URL; each hit is one JSON POST:
  `kind, quarter, product, issue, company, code, template, cluster, platform, placement, ref, weeksSinceChange,
  templateVersion, dataSnapshotId, reconStatus, reconStatusSetOn, userAgent, at`.
- `templateVersion`, `dataSnapshotId` and `reconStatus` (with the date it was set) are logged on every click, so a
  change in clicks can be traced to the page, to the data behind it, or to demand (templates v1.3, Block 0). They
  come from each page's `tracking` field, which the content agent and the Tech data-check job set.
- `reconStatus` is `Matched`, `Mismatch (blocked)` or `Not yet checked`. A page at `Mismatch (blocked)` does not
  publish: it renders no content and records no hit. Only a named analyst can override it, and that is logged.
- That is enough for every view the doc asks for: per product, quarter, company and category, plus per issue
  and placement.
- Bot filtering and the suspect flag belong downstream at ingestion (kickoff §9); the user agent is passed
  through for that. No IP or personal data is recorded.
- Without `HITS_ENDPOINT`, hits are kept in memory (last 10,000) and shown at `GET /api/hits` in preview mode.
  This replaces the earlier `/api/events` test collector.
- GA4 (optional): set `NEXT_PUBLIC_GA_ID`. Register `company, topic_code, template, cluster, product, platform,
  placement, issue, quarter, session_id` as event-scoped custom dimensions.

### 4. Publishing pipeline (pillar 4)
- The pipeline mints one link per topic per issue with the context above and places the block in the report.
  The preview menu (`src/app/page.tsx`) is a minimal working example of minting.
- Test on sample logic first: `npm run check:tracking` is the harness. Extend it with the pipeline's own issue IDs.

---

## Adding a template
1. Add the category to `CATEGORIES` and `TEMPLATE_CODES` in `src/content/taxonomy.ts`.
2. Add its content type to `src/content/types.ts` (only company-specific fields) and to the `PageContent` union.
3. Add `src/templates/Cxx.tsx` from the shared blocks in `src/components/blocks.tsx`, in the layout family's
   block order, and a case in `src/templates/index.tsx`.
4. Add lorem content in `src/content/lorem.ts` and its rules in `scripts/check-content.mts`.

## Rules the code enforces (templates doc, "The rules that do not bend")
- Same six blocks on every page; the order is fixed per layout family.
- A figure without a value is left out and the gap is stated in one line under the exhibit, never an "n/a".
  A table row with no data is dropped the same way.
- C05 has no single page-level as-of date; each exhibit carries its own in its heading.
- C07 is headed "confirmed to"; a next-known date that has passed is hidden automatically. Counts in the title
  block are derived from the register.
- C03: net cash is computed only when every input is present; a quarter without all inputs shows "Not reported" and a
  column empty in every quarter is left out, with the gap stated under the exhibit. Exhibit A is the carrying
  amount, Exhibit B the principal, and the page says they are not reconciled.
- C04: one table, not a chart. The share count is read from the Class A record only for dual-class companies.
- C06: needs at least two quarters to launch. The state is `Guided`, `Not repeated` or `Declined`; movement is
  `Raised`, `Lowered`, `Unchanged`, `New` or a dash and is a dash for anything not guided. Ranges are never
  reduced to a midpoint.
- C08: one holders table per share class where classes differ. Phase 1 matches plan status by name; phase 2 adds the
  transaction code column and the click series restarts. A gift never renders as a sale.
- C09: a fixed six-type list is printed under the register in phase 1. Phase 2 adds the filing item number and type
  follows it; the series restarts. At least six entries over 24 months or the topic goes dormant.
- C11: generated from the publishing system, so it has no analyst sign-off line. If a twelve-week median is missing
  the cell shows a dash and `medianNote` states why.
- C10: each row carries its own period, the peer median is a table row, and a metric reported by fewer than four
  peers is dropped. It is the only template with links out (tracked rotation).
- Every parent page carries the StockDashboard section, below the six blocks, with its own tracked link that
  opens in a new tab and passes UTM tags only.

## Launch gates (templates v1.3, "Launch gate" per template)
These are data and process gates for the pipeline, not code, but each page should stay unpublished until its gate
clears. Dormant means the topic is simply left out of that company's `links`.

| Template | Gate |
|---|---|
| C03 | Blocked on T0, the history fix. Every query filters `period_type = 'Q'` and keys on company id plus market. The debt note must be extractable for every pilot quarter, or net cash is blank across the pilot |
| C04 | Blocked on T0. Filter `period_type = 'Q'`, de-cumulate year-to-date cash-flow values, and check NVIDIA's January rows against the filing. Run the Peer Story anchor check per company before link text freezes |
| C06 | Two consecutive quarters of transcripts that include analyst questions (four is the target). The gate is the analyst-question text, not the quarter count |
| C08 | Settle the Download Center overlap first: one path to insider and holder material. Phase 2 restarts the click series; record the transition date and exclude the changeover |
| C09 | Confirm the 24-month view is not already printed in the report. Phase 2 restarts the series on the same terms as C08 |
| C11 | Backfill twelve weeks of topic tags so the median is live on day one. Never show read counts until platform terms permit it |

## Deploying (Vercel)
Set these in Project Settings → Environment Variables, then **redeploy**. `SIGNALS_PREVIEW` is read at build
time for the menu, so changing it needs a new build.

| Variable | Production | Team demo deployment |
|---|---|---|
| `LINK_SECRET` | Required. Long random string, never rotated | Recommended |
| `SIGNALS_PREVIEW` | Unset | `1` (template menu at `/`, hit viewer at `/api/hits`) |
| `HITS_ENDPOINT` | BST-DB ingestion URL | Optional |
| `REVALIDATE_SECRET`, `NEXT_PUBLIC_GA_ID` | As needed | Optional |

Without `SIGNALS_PREVIEW`, `/` is a 404 by design: there is no public index of these pages. Without `LINK_SECRET` in
production, every link redirects to the public site and the server logs `LINK_SECRET must be set in production`.

## Not discoverable
- `robots.txt` disallows everything.
- `noindex` meta and `X-Robots-Tag` on every response.
- No sitemap, and no links into these pages anywhere.
- The template menu and hit viewer exist only with `SIGNALS_PREVIEW=1`.
- Every link URL is gated by `proxy.ts`: no valid signed token means a redirect to the public site.
- Any other path is a plain 404.
