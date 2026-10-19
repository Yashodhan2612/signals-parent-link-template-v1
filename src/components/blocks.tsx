/**
 * The six blocks every parent page is built from (templates doc, "How to read these templates"):
 *   1 Title and promise   2 Figures   3 Exhibit   4 What it shows   5 How to read it   6 Provenance
 * Templates choose the order (layout family); the blocks themselves never change shape.
 */
import type { ReactNode } from "react";
import type { Figure, Source } from "@/content/types";

/** "Oct 19, 2026". Non-breaking spaces keep a date on one line when a meta line wraps. */
export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .replaceAll(" ", "\u00a0");

/** Words kept lowercase inside a heading, unless first: articles, short conjunctions and short prepositions. */
const SMALL_WORDS = new Set("a an and as at but by for in nor of on or per so the to up via vs yet".split(" "));

/**
 * Title Case for exhibit and table headings: "Contracted but Unspent Commitments by Due Period, as of Oct 3, 2026".
 * The first word and every major word start with a capital; small words (SMALL_WORDS) stay lowercase.
 * Acronyms and labels already in capitals ("FCF", "R&D", "Exhibit A") and units such as "($m)" are left alone.
 * One rule for every template, applied in the shared Exhibit and DataTable components.
 */
export const titleCase = (s: string) =>
  s.replace(/(^|\s)(\p{L}[\p{L}\p{N}'’]*)/gu, (_, sp: string, w: string, offset: number) => {
    if (w === w.toUpperCase()) return sp + w;
    if (offset > 0 && SMALL_WORDS.has(w.toLowerCase())) return sp + w.toLowerCase();
    return sp + w[0].toUpperCase() + w.slice(1);
  });

/* ---------------------------------------------------------------------------------- 1 */

export function TitleBlock({ title, promise, meta }: { title: string; promise: string; meta: ReactNode[] }) {
  return (
    <header>
      <h1 className="serif text-3xl leading-tight sm:text-4xl">{title}</h1>
      {/* The promise line is the link text from the report, word for word. */}
      <p className="mt-2 text-lg leading-snug text-ink-2">{promise}</p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {meta.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </p>
    </header>
  );
}

/* ---------------------------------------------------------------------------------- 2 */

export type LabelledFigure = Figure & { label: string };

/** Splits figures into those we have and those not found in source (never shown as "n/a"). */
export function partition(figures: LabelledFigure[]) {
  return {
    shown: figures.filter((f) => f.value !== null),
    missing: figures.filter((f) => f.value === null).map((f) => f.label),
  };
}

export function FiguresStrip({ figures }: { figures: LabelledFigure[] }) {
  return (
    <section aria-label="The figures" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:auto-cols-fr sm:grid-flow-col">
      {figures.map((f) => (
        <div key={f.label} className="flex flex-col bg-card p-3">
          {/* flex-1 lets the label take the spare height, so values and periods line up across cells however many lines a label wraps to. */}
          <p className="flex-1 text-[11px] leading-snug text-muted">{f.label}</p>
          <p className="tnum mt-1 text-lg font-semibold">{f.value}</p>
          <p className="text-[11px] text-muted-2">
            {f.period} · <a href={`#source-${f.source + 1}`}>[{f.source + 1}]</a>
          </p>
        </div>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------------------------- 3 */

export function Exhibit({ title, children, note }: { title: ReactNode; children: ReactNode; note?: ReactNode }) {
  return (
    <section aria-label="Exhibit" className="rounded-xl border border-line bg-card p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold">{typeof title === "string" ? titleCase(title) : title}</h2>
      {children}
      {note && <div className="mt-3 space-y-1 text-xs text-muted">{note}</div>}
    </section>
  );
}

/** The one line under an exhibit that states what we could not source. */
export function GapNote({ missing }: { missing: string[] }) {
  if (!missing.length) return null;
  return <p>Not found in source, so left out: {missing.join("; ")}.</p>;
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: { key: string; cells: ReactNode[]; highlight?: boolean; muted?: boolean }[];
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line-strong text-[11px] uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th key={c} scope="col" className="py-2 pr-4 font-medium">
                {titleCase(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className={`border-b border-line last:border-0 ${r.highlight ? "bg-accent-soft font-semibold" : ""} ${r.muted ? "text-muted" : ""}`}
            >
              {r.cells.map((cell, i) => (
                <td key={i} className="tnum py-2 pr-4 align-top first:whitespace-nowrap">
                  {cell ?? <span className="text-xs font-normal text-muted-2">Not reported</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------------------------- 4 */

export function WhatItShows({ items }: { items: string[] }) {
  return (
    <section aria-labelledby="shows">
      <h2 id="shows" className="text-sm font-semibold">
        What it shows
      </h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- 5 */

export function HowToRead({ text }: { text: string }) {
  return (
    <section aria-labelledby="how" className="rounded-xl bg-cream-2 p-4">
      <h2 id="how" className="text-sm font-semibold">
        How to read it
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- 6 */

export function Provenance({
  sources,
  stamps,
  verifiedBy,
  verifiedOn,
}: {
  sources: Source[];
  stamps: ReactNode[];
  verifiedBy: string;
  verifiedOn: string;
}) {
  return (
    <footer aria-label="Sources" className="border-t border-line pt-4 text-xs leading-relaxed text-muted">
      <h2 className="font-semibold text-ink-2">Sources</h2>
      <ol className="mt-1 space-y-0.5">
        {sources.map((s, i) => (
          <li key={i} id={`source-${i + 1}`}>
            [{i + 1}] {s.document}, {s.section}, filed {fmtDate(s.filed)}
          </li>
        ))}
      </ol>
      <p className="mt-2">
        {[...stamps, `Verified and signed off: ${verifiedBy}, ${fmtDate(verifiedOn)}`].map((s, i) => (
          <span key={i}>
            {i > 0 && "  ·  "}
            {s}
          </span>
        ))}
      </p>
    </footer>
  );
}
