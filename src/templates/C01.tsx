import { CATEGORIES } from "@/content/taxonomy";
import type { C01Content } from "@/content/types";
import { DataTable, Exhibit, FiguresStrip, GapNote, HowToRead, partition, Provenance, TitleBlock, WhatItShows, fmtDate, titleCase } from "@/components/blocks";

/**
 * C01 Revenue mix. Standard layout, exactly as the workbook "Example page":
 * Title · Figures · Exhibit (8-quarter table) · What it shows · How to read it · Sources.
 */
export function C01({ page }: { page: C01Content }) {
  const cat = CATEGORIES.C01;
  const { shown, missing } = partition(page.figures);
  const rows = page.exhibit.rows.filter((r) => r.cells.some((c) => c !== null));
  const droppedQuarters = page.exhibit.rows.filter((r) => !rows.includes(r)).map((r) => `${r.quarter} (no data)`);
  const stamps = [`As of: ${fmtDate(page.asOf)}`, `Refreshed: ${fmtDate(page.refreshedOn)}`, `Next refresh: ${cat.nextRefresh}`];

  return (
    <>
      <TitleBlock title={cat.title} promise={page.promise} meta={stamps} />
      <FiguresStrip figures={shown} />
      <Exhibit title={titleCase(`Last eight quarters, as of ${fmtDate(page.asOf)}`)} note={<GapNote missing={[...missing, ...droppedQuarters]} />}>
        <DataTable
          columns={["Quarter", ...page.exhibit.columns].map(titleCase)}
          rows={rows.map((r) => ({ key: r.quarter, cells: [r.quarter, ...r.cells] }))}
        />
      </Exhibit>
      <WhatItShows items={page.shows} />
      <HowToRead text={page.howToRead} />
      <Provenance sources={page.sources} stamps={stamps} verifiedBy={page.verifiedBy} verifiedOn={page.verifiedOn} />
    </>
  );
}
