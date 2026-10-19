/**
 * The fixed backbone (live project doc, "How parent links work"; workbook "Core topics").
 * Slot, code, category and cluster never change per company. Only the five templates built so far
 * are listed; C03, C04, C06, C08, C09 and C11 are added here as their templates are signed off.
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

export const TEMPLATE_CODES = ["C01", "C02", "C05", "C07", "C10"] as const;
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
  C05: {
    slot: 5,
    code: "C05",
    title: "Capex and Committed Spend",
    cluster: "Forward-looking interest",
    nextRefresh: "filing ingest; the commitments block mainly with the annual filing",
  },
  C07: {
    slot: 7,
    code: "C07",
    title: "Legal and Regulatory Docket",
    cluster: "Forward-looking interest",
    nextRefresh: "we publish on the matter, or a docket or regulator document is ingested",
  },
  C10: {
    slot: 10,
    code: "C10",
    title: "Peer Ranking and Rotation",
    cluster: "Peer attention rotation",
    nextRefresh: "each row updates as that peer files",
  },
};

export const isTemplateCode = (s: string): s is TemplateCode => (TEMPLATE_CODES as readonly string[]).includes(s);
export const isTopicCode = (s: string): s is TopicCode =>
  isTemplateCode(s) || (SPECIFIC_CODES as readonly string[]).includes(s);
