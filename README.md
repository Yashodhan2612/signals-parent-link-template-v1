# Readership Signals: parent page templates (Live)

The parent pages behind the tracked links in BST reports, branded **Greenwich Research News Data**.
This repo holds the five category templates signed off so far, the link format, and hit capture.

| Code | Category | Layout family | Exhibit |
|---|---|---|---|
| C01 | Revenue Mix | Standard (workbook "Example page") | 8-quarter table |
| C02 | Margins and What Moves Them | Exhibit first | Line chart, three series, spread shaded |
| C05 | Capex and Committed Spend | Two exhibits, two as-of dates | Capex table, then commitments bar |
| C07 | Legal and Regulatory Docket | List, no figures strip | Matter register |
| C10 | Peer Ranking and Rotation | Comparison, exhibit-led | Ranking matrix plus tracked peer links |

Sources of truth: *Readership Signals: Live Project Document* (13 Oct 2026), *Parent Page Templates*
(Kartik, 15 Oct 2026) and the v2 workbook (*Core topics*, *Apple v2*, *Example page* tabs).
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
- The link text is the page's `promise`, word for word (templates doc: "the promise line is the label").

### 3. Hit capture into BST-DB (pillar 2)
- Every page open and StockDashboard click is recorded server-side by `recordHit` (`src/lib/hits.ts`), after the
  response, so it never slows the page and works without JavaScript. Set `HITS_ENDPOINT` to the BST-DB ingestion
  URL; each hit is one JSON POST:
  `kind, quarter, product, issue, company, code, template, cluster, platform, placement, ref, weeksSinceChange, userAgent, at`.
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

## Adding the remaining templates (C03, C04, C06, C08, C09, C11)
1. Add the category to `CATEGORIES` and `TEMPLATE_CODES` in `src/content/taxonomy.ts`.
2. Add its content type to `src/content/types.ts` (only company-specific fields).
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
- C10: each row carries its own period, the peer median is a table row, and a metric reported by fewer than four
  peers is dropped. It is the only template with links out (tracked rotation).
- Every parent page carries the StockDashboard section, below the six blocks, with its own tracked link that
  opens in a new tab and passes UTM tags only.

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
