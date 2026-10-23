import { CATEGORIES } from "@/content/taxonomy";
import { C09_TYPES, type C09Content } from "@/content/types";
import { DataTable, Exhibit, HowToRead, Provenance, TitleBlock, WhatItShows, fmtDate } from "@/components/blocks";

const DASH = "—";

/**
 * C09 Corporate actions record. List layout, no figures strip, phased launch. Phase 1 classifies type from a
 * fixed six-type list, printed under the register so a reader can see the classification is ours rather than
 * the filing's. Phase 2 adds the filing item number column and type follows it; the series restarts there.
 * Title · Register · What it shows · How to read it · Sources.
 */
export function C09({ page }: { page: C09Content }) {
  const cat = CATEGORIES.C09;
  const phase2 = page.phase === 2;
  const refresh = phase2 ? `${cat.nextRefresh}, and 8-K ingest` : cat.nextRefresh;
  const stamps = [`As of: ${fmtDate(page.asOf)}`, `Refreshed: ${fmtDate(page.refreshedOn)}`, `Next refresh: ${refresh}`];

  return (
    <>
      <TitleBlock
        title={cat.title}
        promise={page.promise}
        meta={[`${page.register.length} actions in 24 months`, `Most recent: ${fmtDate(page.register[0].date)}`, ...stamps]}
      />
      <Exhibit
        title={`Corporate actions, last 24 months, as of ${fmtDate(page.asOf)}`}
        note={!phase2 && <p>Types: {C09_TYPES.join(" · ")}</p>}
      >
        <DataTable
          columns={["Date", ...(phase2 ? ["Filing item number"] : []), "Type", "What was announced", "Terms, where disclosed", "Source"]}
          rows={page.register.map((r, i) => ({
            key: `${r.date}-${i}`,
            cells: [fmtDate(r.date), ...(phase2 ? [r.itemNumber] : []), r.type, r.announced, r.terms ?? DASH, r.source],
          }))}
        />
      </Exhibit>
      <WhatItShows items={page.shows} />
      <HowToRead text={page.howToRead} />
      <Provenance sources={page.sources} stamps={stamps} verifiedBy={page.verifiedBy} verifiedOn={page.verifiedOn} />
    </>
  );
}
