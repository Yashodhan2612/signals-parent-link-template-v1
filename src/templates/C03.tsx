import { CATEGORIES } from "@/content/taxonomy";
import type { C03Content } from "@/content/types";
import { DataTable, Exhibit, FiguresStrip, GapNote, HowToRead, partition, Provenance, TitleBlock, WhatItShows, fmtDate } from "@/components/blocks";

const BUCKETS = ["FY+1", "FY+2", "FY+3 to FY+5", "Thereafter"];

/**
 * C03 Debt and balance sheet. Two exhibits on two clocks, like C05: the quarterly filing carries only the
 * aggregate carrying amount, the principal-by-year ladder exists only in the annual filing. A single page-level
 * as-of date is forbidden, so each exhibit carries its own.
 * Title · Figures · Exhibit A · Exhibit B · What it shows · How to read it · Sources.
 */
export function C03({ page }: { page: C03Content }) {
  const cat = CATEGORIES.C03;
  const { exhibitA: A, exhibitB: B } = page;
  const f = page.figures;
  const { shown, missing } = partition([
    { ...f.termDebt, label: "Term debt, carrying amount (USD m, quarter end)" },
    { ...f.commercialPaper, label: "Commercial paper (USD m)" },
    { ...f.dueWithin12Months, label: "Term debt due within 12 months (USD m)" },
    { ...f.netCash, label: "Net cash or net debt (USD m, computed)" },
  ]);
  // Net cash is computed only when every input is present. If no quarter has all inputs, the column is left out.
  const hasNetCash = A.rows.some((r) => r.netCash !== null);
  const gaps = hasNetCash || missing.some((m) => m.startsWith("Net cash")) ? missing : [...missing, "net cash or net debt column"];
  const stamps = [`Exhibit A as of: ${fmtDate(A.asOf)}`, `Exhibit B as of: ${fmtDate(B.asOf)}`, `Refreshed: ${fmtDate(page.refreshedOn)}`, `Next refresh: ${cat.nextRefresh}`];

  return (
    <>
      <TitleBlock title={cat.title} promise={page.promise} meta={stamps} />
      <FiguresStrip figures={shown} />
      <Exhibit title={`Exhibit A · Debt and cash, eight quarters, as of ${fmtDate(A.asOf)}`} note={<GapNote missing={gaps} />}>
        <DataTable
          columns={[
            "Quarter",
            "Term debt, carrying (USD m)",
            "Commercial paper (USD m)",
            "Cash and securities (USD m)",
            ...(hasNetCash ? ["Net cash or net debt (USD m)"] : []),
          ]}
          rows={A.rows.map((r) => ({
            key: r.quarter,
            cells: [r.quarter, r.termDebt, r.commercialPaper, r.cash, ...(hasNetCash ? [r.netCash] : [])],
          }))}
        />
      </Exhibit>
      <Exhibit title={`Exhibit B · Term debt principal due by fiscal year, as of ${fmtDate(B.asOf)}`} note={<p>{B.nextUpdate}</p>}>
        <DataTable
          columns={["Fiscal year", "Principal due (USD m)", "Share of term debt (%)"]}
          rows={B.rows.map((r, i) => ({ key: BUCKETS[i], cells: [BUCKETS[i], r.principal, r.share] }))}
        />
      </Exhibit>
      <WhatItShows items={page.shows} />
      <HowToRead text={page.howToRead} />
      <Provenance sources={page.sources} stamps={stamps} verifiedBy={page.verifiedBy} verifiedOn={page.verifiedOn} />
    </>
  );
}
