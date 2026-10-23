import { CATEGORIES } from "@/content/taxonomy";
import type { C06Content } from "@/content/types";
import { DataTable, Exhibit, HowToRead, Provenance, TitleBlock, WhatItShows, fmtDate } from "@/components/blocks";

const DASH = "—";

/**
 * C06 Guidance record. List layout: no figures strip, the register is the page. Grouped by quarter, newest
 * first. Two classifications sit side by side: a three-state tag (what happened to the item) and a movement
 * column (which direction it went). Counts a reader needs are derived from the newest quarter and carried
 * in the title block. Title · Register · What it shows · How to read it · Sources.
 */
export function C06({ page }: { page: C06Content }) {
  const cat = CATEGORIES.C06;
  const latest = page.quarters[0]?.entries ?? [];
  const count = (state: string) => latest.filter((e) => e.state === state).length;
  const stamps = [`As of: ${fmtDate(page.asOf)}`, `Refreshed: ${fmtDate(page.refreshedOn)}`, `Next refresh: ${cat.nextRefresh}`];

  return (
    <>
      <TitleBlock
        title={cat.title}
        promise={page.promise}
        meta={[
          `${count("Guided")} guided this quarter`,
          `${count("Not repeated")} not repeated`,
          `${count("Declined")} declined`,
          ...stamps,
        ]}
      />
      <Exhibit title={`Guidance register, newest quarter first, as of ${fmtDate(page.asOf)}`}>
        <DataTable
          columns={["Item", "Figure or range as given", "State", "vs prior quarter", "Source", "Speaker", "Date"]}
          rows={page.quarters.flatMap((q) => [
            { key: q.label, group: q.label, cells: [] },
            ...q.entries.map((e, i) => ({
              key: `${q.label}-${i}`,
              cells: [e.item, e.figure, e.state, e.movement ?? DASH, e.source ?? DASH, e.speaker ?? DASH, e.date ? fmtDate(e.date) : DASH],
            })),
          ])}
        />
      </Exhibit>
      <WhatItShows items={page.shows} />
      <HowToRead text={page.howToRead} />
      <Provenance sources={page.sources} stamps={stamps} verifiedBy={page.verifiedBy} verifiedOn={page.verifiedOn} />
    </>
  );
}
