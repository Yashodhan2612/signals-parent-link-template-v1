import { CATEGORIES } from "@/content/taxonomy";
import type { C08Content } from "@/content/types";
import { DataTable, Exhibit, FiguresStrip, GapNote, HowToRead, partition, Provenance, TitleBlock, WhatItShows, fmtDate } from "@/components/blocks";

/**
 * C08 Ownership and insider activity. Two exhibits on two clocks (holdings quarterly, insider filings daily),
 * so each carries its own as-of date. Exhibit A is one table per share class where classes differ, which is
 * the standard misreading at a controlled company. Exhibit B launches in two phases with the layout fixed:
 * phase 2 adds the transaction code column, and the click series restarts there.
 * Title · Figures · Exhibit A · Exhibit B · What it shows · How to read it · Sources.
 */
export function C08({ page }: { page: C08Content }) {
  const cat = CATEGORIES.C08;
  const { exhibitA: A, exhibitB: B } = page;
  const f = page.figures;
  const { shown, missing } = partition([
    { ...f.institutionalShare, label: "Institutional share of outstanding (%, as of holdings date)" },
    { ...f.topTenShare, label: "Top ten holders’ combined share (%)" },
    { ...f.topTenChange, label: "Net change in top-ten holdings vs prior quarter (m shares)" },
    { ...f.insiderSales90d, label: "Insider sales, trailing 90 days (count)" },
    { ...f.plansLatest, label: "Trading plans adopted or terminated, latest quarterly filing (count)" },
  ]);
  const withCode = B.phase === 2;
  const stamps = [`Exhibit A as of: ${fmtDate(A.asOf)}`, `Exhibit B as of: ${fmtDate(B.asOf)}`, `Refreshed: ${fmtDate(page.refreshedOn)}`, `Next refresh: ${cat.nextRefresh}`];

  return (
    <>
      <TitleBlock title={cat.title} promise={page.promise} meta={stamps} />
      <FiguresStrip figures={shown} />
      <Exhibit title={`Exhibit A · Top ten holders, as of ${fmtDate(A.asOf)}`} note={<GapNote missing={missing} />}>
        <div className="space-y-5">
          {A.classes.map((c) => (
            <div key={c.label ?? "all"}>
              {c.label && <h3 className="mb-1 text-xs font-semibold text-ink-2">{c.label}</h3>}
              <DataTable
                columns={["Holder", "This quarter (m)", "Prior quarter (m)", "Change (m)", "Share of outstanding (%)"]}
                rows={c.holders.map((h) => ({ key: h.holder, cells: [h.holder, h.thisQuarter, h.priorQuarter, h.change, h.share] }))}
              />
            </div>
          ))}
        </div>
      </Exhibit>
      <Exhibit title={`Exhibit B · Insider transactions, last twelve months, as of ${fmtDate(B.asOf)}`}>
        <DataTable
          columns={[
            "Date",
            "Insider and role",
            "Buy, sale or gift",
            ...(withCode ? ["Transaction code"] : []),
            "Shares",
            "Price (USD)",
            "Holding after",
            "Trading plan disclosed (date)",
          ]}
          rows={B.rows.map((r, i) => ({
            key: `${r.date}-${i}`,
            cells: [
              fmtDate(r.date),
              r.insider,
              r.type,
              ...(withCode ? [r.code] : []),
              r.shares,
              r.price,
              r.holdingAfter,
              r.planDisclosed ? fmtDate(r.planDisclosed) : <span className="text-xs font-normal text-muted-2">None disclosed</span>,
            ],
          }))}
        />
      </Exhibit>
      <WhatItShows items={page.shows} />
      <HowToRead text={page.howToRead} />
      <Provenance sources={page.sources} stamps={stamps} verifiedBy={page.verifiedBy} verifiedOn={page.verifiedOn} />
    </>
  );
}
