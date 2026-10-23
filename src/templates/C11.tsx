import { CATEGORIES } from "@/content/taxonomy";
import type { C11Content } from "@/content/types";
import { DataTable, Exhibit, HowToRead, Provenance, TitleBlock, WhatItShows, fmtDate } from "@/components/blocks";

const DASH = "—";

/**
 * C11 Coverage and attention. Weekly list, generated from the publishing system: no analyst content, so the
 * only page without a sign-off line. One row per topic in the company's own parent-link set, stories this
 * week against the company's own twelve-week median (current week excluded).
 * Title · Topic table · What it shows · How to read it · Sources.
 */
export function C11({ page }: { page: C11Content }) {
  const cat = CATEGORIES.C11;
  const stamps = [`Week ending: ${fmtDate(page.weekEnding)}`, `Refreshed: ${fmtDate(page.refreshedOn)}`, `Next refresh: ${cat.nextRefresh}`];

  return (
    <>
      <TitleBlock title={cat.title} promise={page.promise} meta={stamps} />
      <Exhibit
        title={`Topic coverage, week ending ${fmtDate(page.weekEnding)}`}
        note={page.rows.some((r) => r.median === null) && page.medianNote ? <p>{page.medianNote}</p> : undefined}
      >
        <DataTable
          columns={["Topic", "Stories this week", "12-week median", "Most-covered story this week"]}
          rows={page.rows.map((r) => ({
            key: r.topic,
            cells: [r.topic, r.stories, r.median ?? DASH, r.top ? `${r.top.headline}, ${fmtDate(r.top.date)}` : DASH],
          }))}
        />
      </Exhibit>
      <WhatItShows items={page.shows} />
      <HowToRead text={page.howToRead} />
      <Provenance sources={page.sources} stamps={stamps} note="Generated from our publishing system. No analyst review." />
    </>
  );
}
