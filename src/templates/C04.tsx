import { CATEGORIES } from "@/content/taxonomy";
import type { C04Content } from "@/content/types";
import { DataTable, Exhibit, FiguresStrip, GapNote, HowToRead, partition, Provenance, TitleBlock, WhatItShows, fmtDate } from "@/components/blocks";

/**
 * C04 Capital returns and share count. Standard layout: one table, eight quarters, the last column answering
 * the page's question. A table rather than a chart: the reader checks these figures against a model.
 * Title · Figures · Exhibit · What it shows · How to read it · Sources.
 */
export function C04({ page }: { page: C04Content }) {
  const cat = CATEGORIES.C04;
  const f = page.figures;
  const { shown, missing } = partition([
    { ...f.repurchase, label: "Repurchase spend, latest quarter (USD m)" },
    { ...f.dividends, label: "Dividends paid, latest quarter (USD m)" },
    { ...f.dilutedShares, label: "Diluted share count (m)" },
    { ...f.shareChange, label: "Change in count vs prior year (%)" },
    { ...f.authorisation, label: "Remaining authorisation (USD m)" },
  ]);
  const stamps = [`As of: ${fmtDate(page.asOf)}`, `Refreshed: ${fmtDate(page.refreshedOn)}`, `Next refresh: ${cat.nextRefresh}`];

  return (
    <>
      <TitleBlock title={cat.title} promise={page.promise} meta={stamps} />
      <FiguresStrip figures={shown} />
      <Exhibit title={`Capital returns, eight quarters, as of ${fmtDate(page.asOf)}`} note={<GapNote missing={missing} />}>
        <DataTable
          columns={[
            "Quarter",
            "Repurchase spend (USD m)",
            "Dividends paid (USD m)",
            "Shares repurchased (m)",
            "Shares issued under plans (m)",
            "Diluted shares (m)",
            "Change vs prior year (%)",
          ]}
          rows={page.rows.map((r) => ({
            key: r.quarter,
            cells: [r.quarter, r.repurchase, r.dividends, r.sharesRepurchased, r.sharesIssued, r.diluted, r.change],
          }))}
        />
      </Exhibit>
      <WhatItShows items={page.shows} />
      <HowToRead text={page.howToRead} />
      <Provenance sources={page.sources} stamps={stamps} verifiedBy={page.verifiedBy} verifiedOn={page.verifiedOn} />
    </>
  );
}
