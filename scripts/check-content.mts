/**
 * npm run check:content
 * Checks every live page of every company against the template rules (templates doc, "The rules that
 * do not bend" and each template's spec). Errors fail the run; warnings are reported only.
 * Run it after the content agent writes, before content goes live.
 */
import { source } from "@/content/source";
import { CATEGORIES, SPECIFIC_CODES, TEMPLATE_CODES } from "@/content/taxonomy";
import { C10_METRICS, type Figure, type PageContent } from "@/content/types";

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
/** Dates are ISO strings, so lexical order is date order. */
const newestFirst = (dates: string[]) => dates.every((d, i) => i === 0 || dates[i - 1] >= d);

/** The figures strip of a page; empty for list layouts, which carry none. */
function figuresOf(page: PageContent): Figure[] {
  switch (page.template) {
    case "C01":
      return page.figures;
    case "C10":
      return [...page.figures.ranks, page.figures.peerMedian, page.figures.asOfRange];
    case "C06":
    case "C07":
    case "C09":
    case "C11":
      return [];
    default:
      return Object.values(page.figures);
  }
}
let errors = 0;
let warnings = 0;

function check(page: PageContent): { errors: string[]; warnings: string[] } {
  const e: string[] = [];
  const w: string[] = [];
  const need = (ok: boolean, msg: string) => ok || e.push(msg);

  need(page.promise.trim().length > 0, "promise line is empty");
  // Link text is the first four to seven words of the promise, verbatim (templates v1.3, Block 1).
  const lt = words(page.linkText);
  need(lt >= 4 && lt <= 7 && page.promise.startsWith(`${page.linkText} `), `link text must be the first 4-7 words of the promise, verbatim (found ${lt} words)`);
  need(page.shows.length >= 3 && page.shows.length <= 5, `What it shows has ${page.shows.length} bullets (3-5)`);
  page.shows.forEach((s, i) => need(words(s) < 25, `What it shows bullet ${i + 1} is ${words(s)} words (under 25)`));
  const hw = words(page.howToRead);
  need(hw >= 40 && hw <= 80, `How to read it is ${hw} words (40-80)`);
  need(page.sources.length > 0, "no sources");
  // Every page is signed off by a named analyst, except C11, which is generated and has no analyst.
  if (page.template === "C11") need(!page.verifiedBy && !page.verifiedOn, "C11 has no analyst and must carry no sign-off line");
  else need(!!page.verifiedBy && !!page.verifiedOn, "missing the analyst sign-off (verifiedBy, verifiedOn)");
  if (page.tracking.reconStatus === "Mismatch (blocked)") w.push("recon_status is Mismatch (blocked): this page will not publish");

  const figures = figuresOf(page);
  figures.forEach((f, i) => need(f.source >= 0 && f.source < page.sources.length, `figure ${i + 1} cites source [${f.source + 1}], which is not listed`));
  if (figures.length) {
    const present = figures.filter((f) => f.value !== null).length;
    need(present >= 3 && present <= 5, `${present} figures with a value (3-5)`);
  }

  switch (page.template) {
    case "C01":
      need(page.exhibit.rows.length === 8, `exhibit has ${page.exhibit.rows.length} quarters (8)`);
      page.exhibit.rows.forEach((r) => need(r.cells.length === page.exhibit.columns.length, `${r.quarter}: cell count does not match columns`));
      break;
    case "C02":
      for (const k of ["categoryA", "categoryB", "consolidated"] as const)
        need(page.chart[k].length === page.chart.quarters.length && page.chart.quarters.length === 8, `chart series ${k} must have 8 quarters`);
      break;
    case "C05":
      need(page.exhibitA.rows.length === 8, `Exhibit A has ${page.exhibitA.rows.length} quarters (8)`);
      if (page.exhibitA.asOf === page.exhibitB.asOf) w.push("Exhibit A and B share an as-of date; confirm both are right");
      need(page.exhibitB.nextMove.trim().length > 0, "Exhibit B needs a line saying when the commitments note next moves");
      break;
    case "C03":
      need(page.exhibitA.rows.length === 8, `Exhibit A has ${page.exhibitA.rows.length} quarters (8)`);
      need(page.exhibitB.rows.length === 4, `Exhibit B has ${page.exhibitB.rows.length} buckets (4)`);
      if (page.exhibitA.asOf === page.exhibitB.asOf) w.push("Exhibit A and B share an as-of date; confirm both are right");
      need(page.exhibitB.nextUpdate.trim().length > 0, "Exhibit B needs a line saying when the annual filing next updates it");
      break;
    case "C04":
      need(page.rows.length === 8, `the table has ${page.rows.length} quarters (8)`);
      break;
    case "C06": {
      need(page.quarters.length >= 2, `${page.quarters.length} quarter(s) of guidance; launch needs at least two`);
      const entries = page.quarters.flatMap((q) => q.entries);
      if (entries.length < 6) w.push(`register has ${entries.length} entries (at least 6); below the floor the topic goes dormant`);
      for (const e of entries) {
        if (e.state === "Declined") need(words(e.figure) < 15, `declined question "${e.item}" is ${words(e.figure)} words (under 15)`);
        if (e.state !== "Guided") need(e.movement === null, `"${e.item}" is ${e.state}: movement must be a dash`);
      }
      break;
    }
    case "C07": {
      const n = page.register.length;
      if (n < 8 || n > 20) w.push(`register has ${n} matters (8-20); below the floor the topic goes dormant`);
      need(new Set(page.register.map((m) => m.id)).size === n, "duplicate matter ids");
      break;
    }
    case "C08": {
      const { classes } = page.exhibitA;
      need(classes.length > 0 && classes.every((c) => c.holders.length > 0 && c.holders.length <= 10), "Exhibit A needs 1-10 holders per share class");
      need(classes.length === 1 || classes.every((c) => c.label), "with more than one share class every table needs its class label");
      const log = page.exhibitB;
      need(newestFirst(log.rows.map((r) => r.date)), "Exhibit B must be newest first");
      if (log.phase === 2) need(log.rows.every((r) => r.code !== null), "phase 2: every transaction needs its code");
      else if (log.rows.some((r) => r.code !== null)) w.push("phase 1: transaction codes are ignored (the column arrives in phase 2)");
      break;
    }
    case "C09": {
      const n = page.register.length;
      if (n < 6) w.push(`register has ${n} entries (at least 6 over 24 months); below the floor the topic goes dormant`);
      need(newestFirst(page.register.map((r) => r.date)), "the register must be newest first");
      if (page.phase === 2) need(page.register.every((r) => r.itemNumber), "phase 2: every action needs its filing item number");
      break;
    }
    case "C10":
      need(page.rows.length === 8, `table has ${page.rows.length} companies (this one plus seven peers)`);
      need(page.rows[0]?.companyId === page.company.id, "first row must be this company");
      for (const m of C10_METRICS) {
        const reporting = page.rows.slice(1).filter((r) => r.values[m] !== null).length;
        if (reporting < 4) w.push(`${m}: only ${reporting} peers report it, so the column is dropped`);
      }
      break;
    case "C11":
      if (page.rows.length < 6) w.push(`${page.rows.length} topic rows (at least 6); below the floor the topic goes dormant`);
      need(page.rows.every((r, i) => i === 0 || page.rows[i - 1].stories >= r.stories), "rows must be sorted by stories this week, highest first");
      need(new Set(page.rows.map((r) => r.topic)).size === page.rows.length, "duplicate topic rows");
      if (page.rows.some((r) => r.median === null)) need(!!page.medianNote, "a median is missing: state the reason in medianNote");
      break;
  }
  return { errors: e, warnings: w };
}

const companies = await source.listCompanies();
const ids = new Set(companies.map((c) => c.id));
let pages = 0;

for (const c of companies) {
  console.log(`\n${c.name} (${c.id}) · ${c.links.length} parent links`);
  const codes = c.links.map((l) => l.code);
  if (new Set(codes).size !== codes.length) (errors++, console.error("  ✗ duplicate topic codes"));
  if (c.links.length > 15) (errors++, console.error("  ✗ more than 15 parent links"));
  const slots = c.links.map((l) => (l.code.startsWith("S") ? Number(l.code.slice(1)) : CATEGORIES[l.template].slot));
  if (slots.some((s, i) => i > 0 && s <= slots[i - 1])) (errors++, console.error("  ✗ links are not in slot order"));
  if (c.peers.length !== 7 || c.peers.some((p) => !ids.has(p) || p === c.id)) (warnings++, console.warn("  ! peer set is not seven other known companies"));

  for (const link of c.links) {
    const isCore = (TEMPLATE_CODES as readonly string[]).includes(link.code);
    if (isCore && link.code !== link.template) (errors++, console.error(`  ✗ ${link.code} must use its own template`));
    if (!isCore && !(SPECIFIC_CODES as readonly string[]).includes(link.code)) (errors++, console.error(`  ✗ ${link.code} is not a known code`));

    const page = await source.getPage(c.id, link.code);
    if (!page) {
      errors++;
      console.error(`  ✗ ${link.code}: listed as live but has no content`);
      continue;
    }
    pages++;
    const r = check(page);
    errors += r.errors.length;
    warnings += r.warnings.length;
    const label = `${link.code}${link.code !== link.template ? ` → ${link.template} template (${CATEGORIES[link.template].cluster})` : ""}`;
    console.log(`  ${r.errors.length ? "✗" : "✓"} ${label}`);
    r.errors.forEach((m) => console.error(`      ✗ ${m}`));
    r.warnings.forEach((m) => console.warn(`      ! ${m}`));
  }
}

console.log(`\n${companies.length} companies · ${pages} pages · ${errors} errors · ${warnings} warnings`);
if (errors) process.exit(1);
