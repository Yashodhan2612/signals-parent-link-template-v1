/**
 * The fixed backbone (live project doc, "How parent links work"; workbook "Core topics").
 * Slot, code, category and cluster never change per company. All eleven core templates are built.
 */

export const CLUSTERS = [
  "Operating performance",
  "Solvency and balance sheet",
  "Corporate actions",
  "Forward-looking interest",
  "Ownership and insider behaviour",
  "Peer attention rotation",
  "News attention and buzz",
] as const;
export type Cluster = (typeof CLUSTERS)[number];

export const TEMPLATE_CODES = ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10", "C11"] as const;
export type TemplateCode = (typeof TEMPLATE_CODES)[number];

/** S12-S15: company-specific links, each rendered with a core template from its own cluster. */
export const SPECIFIC_CODES = ["S12", "S13", "S14", "S15"] as const;
export type SpecificCode = (typeof SPECIFIC_CODES)[number];
export type TopicCode = TemplateCode | SpecificCode;

export type Category = {
  slot: number;
  code: TemplateCode;
  /** Block 1 title. Fixed for every company. */
  title: string;
  cluster: Cluster;
  /** What triggers the next refresh, shown in the title and provenance blocks. */
  nextRefresh: string;
};

export const CATEGORIES: Record<TemplateCode, Category> = {
  C01: {
    slot: 1,
    code: "C01",
    title: "Revenue Mix",
    cluster: "Operating performance",
    nextRefresh: "Quarterly, within 3 working days of the 10-Q or 10-K",
  },
  C02: {
    slot: 2,
    code: "C02",
    title: "Margins and What Moves Them",
    cluster: "Operating performance",
    nextRefresh: "filing ingest; quoted drivers on transcript ingest",
  },
  C03: {
    slot: 3,
    code: "C03",
    title: "Debt and Balance Sheet",
    cluster: "Solvency and balance sheet",
    nextRefresh: "10-Q ingest for Exhibit A; 10-K ingest for Exhibit B",
  },
  C04: {
    slot: 4,
    code: "C04",
    title: "Capital Returns and Share Count",
    cluster: "Corporate actions",
    nextRefresh: "filing ingest; authorisations and declarations on the announcement",
  },
  C05: {
    slot: 5,
    code: "C05",
    title: "Capex and Committed Spend",
    cluster: "Forward-looking interest",
    nextRefresh: "filing ingest; the commitments block mainly with the annual filing",
  },
  C06: {
    slot: 6,
    code: "C06",
    title: "Guidance Record",
    cluster: "Forward-looking interest",
    nextRefresh: "the release and the transcript are ingested, within one working day",
  },
  C07: {
    slot: 7,
    code: "C07",
    title: "Legal and Regulatory Docket",
    cluster: "Forward-looking interest",
    nextRefresh: "we publish on the matter, or a docket or regulator document is ingested",
  },
  C08: {
    slot: 8,
    code: "C08",
    title: "Ownership and Insider Activity",
    cluster: "Ownership and insider behaviour",
    nextRefresh: "insider filings daily as filed; holder table after each quarterly holdings deadline",
  },
  C09: {
    slot: 9,
    code: "C09",
    title: "Corporate Actions Record",
    cluster: "Corporate actions",
    nextRefresh: "on load of director, dividend and announcement data",
  },
  C10: {
    slot: 10,
    code: "C10",
    title: "Peer Ranking and Rotation",
    cluster: "Peer attention rotation",
    nextRefresh: "each row updates as that peer files",
  },
  C11: {
    slot: 11,
    code: "C11",
    title: "Coverage and Attention",
    cluster: "News attention and buzz",
    nextRefresh: "rolling seven days, regenerated daily from the publishing system",
  },
};

export const isTemplateCode = (s: string): s is TemplateCode => (TEMPLATE_CODES as readonly string[]).includes(s);
export const isTopicCode = (s: string): s is TopicCode =>
  isTemplateCode(s) || (SPECIFIC_CODES as readonly string[]).includes(s);
