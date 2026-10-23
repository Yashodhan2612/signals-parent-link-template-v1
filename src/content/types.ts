/**
 * Content contract for the parent pages: the fields the content agent (pillar 1) fills per company.
 *
 * Everything typed here is company-specific. Everything fixed per category (titles, column headers,
 * metric lists, due-period buckets, refresh triggers) lives in the templates and taxonomy instead,
 * so the agent cannot change a page's shape. Dates are ISO strings (YYYY-MM-DD).
 */
import type { Cluster, TemplateCode, TopicCode } from "./taxonomy";

export type CompanyLink = {
  code: TopicCode;
  /** Core codes use their own template; S12-S15 name the core template of their cluster. */
  template: TemplateCode;
};

export type Company = {
  /** Stable id used in links and hit logs, e.g. "aapl". */
  id: string;
  name: string;
  /** Live parent links in slot order. A dormant topic is simply absent. */
  links: CompanyLink[];
  /** C10 peer set: exactly seven company ids, fixed for the pilot. */
  peers: string[];
};

/** A source document. Figures point at one by index. */
export type Source = { document: string; section: string; filed: string };

/** One figure value. `value: null` means not found in source: the figure is left out and the gap stated. */
export type Figure = { value: string | null; period: string; source: number };

/** Page-level data check state (templates v1.3, Block 0). Set by a Tech job on every data load and weekly. */
export type ReconStatus = "Matched" | "Mismatch (blocked)" | "Not yet checked";

/** Logged with every hit so a change in clicks can be traced to the page, the data behind it, or demand. */
export type Tracking = {
  templateVersion: string;
  dataSnapshotId: string;
  reconStatus: ReconStatus;
  /** Date reconStatus was last set. */
  reconStatusSetOn: string;
};

type Common = {
  company: Pick<Company, "id" | "name">;
  code: TopicCode;
  cluster: Cluster;
  /** Block 1 promise line. */
  promise: string;
  /** The report link text: the first four to seven words of `promise`, verbatim. Change both together. */
  linkText: string;
  refreshedOn: string;
  /** When the substance of the page last changed. Logged with every hit as weeks-since-change. */
  contentChangedOn: string;
  /** Block 4: three to five bullets, under 25 words each. Descriptive only. */
  shows: string[];
  /** Block 5: 40 to 80 words. Method, inclusions, exclusions, source, caveat. */
  howToRead: string;
  /** Block 6. */
  sources: Source[];
  /** Sign-off line. Absent only on C11, which is generated and has no analyst. */
  verifiedBy?: string;
  verifiedOn?: string;
  tracking: Tracking;
};

/** C01 Revenue mix. Standard layout; workbook "Example page". */
export type C01Content = Common & {
  template: "C01";
  asOf: string;
  /** Five figures. Labels are company-specific and carry their unit. */
  figures: (Figure & { label: string })[];
  /** Eight quarters (Q-7 to Q-0). Column headers are company-specific. */
  exhibit: { columns: string[]; rows: { quarter: string; cells: (string | null)[] }[] };
};

/** C02 Margins. Exhibit first. */
export type C02Content = Common & {
  template: "C02";
  asOf: string;
  /** The two disclosed categories whose margins are compared, e.g. ["Products", "Services"]. */
  categories: [string, string];
  figures: { categoryA: Figure; categoryB: Figure; spread: Figure; spreadChange: Figure; consolidated: Figure };
  /** Eight quarters, three series at the hard limit. Percent values; null where not disclosed. */
  chart: { quarters: string[]; categoryA: (number | null)[]; categoryB: (number | null)[]; consolidated: (number | null)[] };
};

/** C05 Capex. Two exhibits on two clocks; no single page-level as-of date. */
export type C05Content = Common & {
  template: "C05";
  figures: {
    capexLatest: Figure;
    capexTtm: Figure;
    capexToOcf: Figure;
    commitments: Figure;
    dueWithinYear: Figure;
  };
  exhibitA: {
    asOf: string;
    rows: {
      quarter: string;
      capex: string | null;
      capexToRevenue: string | null;
      capexToOcf: string | null;
      depreciation: string | null;
    }[];
  };
  exhibitB: {
    asOf: string;
    /** One line: when the commitments note next moves. */
    nextMove: string;
    /** $m by due period, in bucket order: under 1 year, 1-3, 3-5, over 5. */
    buckets: [number, number, number, number];
  };
  /** Where the build runs through leases, name it here rather than folding it into capex. */
  leaseNote?: string;
};

/** C07 Legal docket. List layout; no figures strip. Counts are derived from the register. */
export type C07Content = Common & {
  template: "C07";
  /** The page is "confirmed to" this date, not "refreshed". */
  confirmedTo: string;
  register: {
    id: string;
    matter: string;
    jurisdiction: string;
    /** The court's or regulator's own term. */
    stage: string;
    opened: string;
    /** Last date confirmed on the docket. Hidden automatically once it has passed. */
    nextKnownDate: string | null;
    /** Only what the company itself disclosed; null renders "None disclosed". */
    exposure: string | null;
  }[];
};

export const C10_METRICS = [
  "Rev. growth",
  "Gross margin",
  "Op. margin",
  "FCF margin",
  "Capex / rev.",
  "Net cash",
  "R&D / rev.",
  "Share count chg.",
  "Multiple",
] as const;
export type C10Metric = (typeof C10_METRICS)[number];

/** C10 Peer ranking. Comparison layout; the only template that links out (tracked rotation). */
export type C10Content = Common & {
  template: "C10";
  asOf: string;
  /** Used in the promise and labels, e.g. "hardware and platform". */
  sector: string;
  figures: {
    /** The three metrics the figures strip ranks on, in order. */
    rankedOn: [C10Metric, C10Metric, C10Metric];
    ranks: [Figure, Figure, Figure];
    peerMedian: Figure;
    asOfRange: Figure;
  };
  /** This company first, then its seven peers. Every row carries its own period. */
  rows: { companyId: string; name: string; period: string; values: Record<C10Metric, string | null> }[];
  median: Record<C10Metric, string | null>;
};

/** C03 Debt and balance sheet. Two exhibits on two clocks: quarterly filing, then the annual ladder. */
export type C03Content = Common & {
  template: "C03";
  figures: { termDebt: Figure; commercialPaper: Figure; dueWithin12Months: Figure; netCash: Figure };
  exhibitA: {
    asOf: string;
    /** Eight quarters. Carrying amount, not principal. A cell is null where an input is missing. */
    rows: { quarter: string; termDebt: string | null; commercialPaper: string | null; cash: string | null; netCash: string | null }[];
  };
  exhibitB: {
    asOf: string;
    /** One line: "Next update with the [FY] annual filing, expected [month]." */
    nextUpdate: string;
    /** Buckets in order: FY+1, FY+2, FY+3 to FY+5, Thereafter. */
    rows: [DebtBucket, DebtBucket, DebtBucket, DebtBucket];
  };
};
type DebtBucket = { principal: string | null; share: string | null };

/** C04 Capital returns and share count. Standard layout, one table. */
export type C04Content = Common & {
  template: "C04";
  asOf: string;
  figures: { repurchase: Figure; dividends: Figure; dilutedShares: Figure; shareChange: Figure; authorisation: Figure };
  /** Eight quarters. Quarterly cash-flow values are de-cumulated from year-to-date before they get here. */
  rows: {
    quarter: string;
    repurchase: string | null;
    dividends: string | null;
    sharesRepurchased: string | null;
    sharesIssued: string | null;
    diluted: string | null;
    change: string | null;
  }[];
};

export const GUIDANCE_STATES = ["Guided", "Not repeated", "Declined"] as const;
export const GUIDANCE_MOVEMENTS = ["Raised", "Lowered", "Unchanged", "New"] as const;
export const GUIDANCE_SOURCES = ["Release", "Call", "Q&A", "8-K"] as const;
export type GuidanceState = (typeof GUIDANCE_STATES)[number];
export type GuidanceMovement = (typeof GUIDANCE_MOVEMENTS)[number];
export type GuidanceSource = (typeof GUIDANCE_SOURCES)[number];

/** C06 Guidance record. List layout, no figures strip. Needs at least two quarters to launch. */
export type C06Content = Common & {
  template: "C06";
  asOf: string;
  /** Newest quarter first. */
  quarters: {
    label: string;
    entries: {
      item: string;
      /** As given, never a midpoint. Not repeated: last quarter's wording. Declined: the question, under 15 words. */
      figure: string;
      state: GuidanceState;
      /** null renders a dash. */
      movement: GuidanceMovement | null;
      source: GuidanceSource | null;
      speaker: string | null;
      date: string | null;
    }[];
  }[];
};

/** C08 Ownership and insider activity. Two exhibits, two as-of dates, phased launch. */
export type C08Content = Common & {
  template: "C08";
  figures: { institutionalShare: Figure; topTenShare: Figure; topTenChange: Figure; insiderSales90d: Figure; plansLatest: Figure };
  exhibitA: {
    asOf: string;
    /** One table per share class where classes differ (label set); a single unlabelled class otherwise. */
    classes: {
      label: string | null;
      holders: { holder: string; thisQuarter: string | null; priorQuarter: string | null; change: string | null; share: string | null }[];
    }[];
  };
  exhibitB: {
    asOf: string;
    /** 1 = plan status matched from filings. 2 adds the transaction code column. The click series restarts at phase 2. */
    phase: 1 | 2;
    /** Twelve months, newest first. */
    rows: {
      date: string;
      /** Name and role. */
      insider: string;
      /** A gift must never render as a sale. */
      type: "Buy" | "Sale" | "Gift";
      /** Phase 2 only. */
      code: string | null;
      shares: string | null;
      price: string | null;
      holdingAfter: string | null;
      /** Date a trading plan was disclosed, matched by name; null renders "None disclosed". */
      planDisclosed: string | null;
    }[];
  };
};

export const C09_TYPES = [
  "Leadership or board",
  "Dividend decision",
  "Buyback authorisation",
  "Debt or equity issuance",
  "Acquisition or disposal",
  "Other filed event",
] as const;

/** C09 Corporate actions record. List layout, no figures strip, phased launch. */
export type C09Content = Common & {
  template: "C09";
  asOf: string;
  /** 1 = fixed six-type list printed at the foot. 2 adds the filing item number column and type follows it. */
  phase: 1 | 2;
  /** 24 months, newest first. At least six entries to launch. */
  register: {
    date: string;
    /** Phase 2 only. */
    itemNumber: string | null;
    type: (typeof C09_TYPES)[number];
    announced: string;
    /** null renders a dash. */
    terms: string | null;
    /** Story id or filing. */
    source: string;
  }[];
};

/** C11 Coverage and attention. Weekly list, generated from the publishing system. No analyst sign-off. */
export type C11Content = Common & {
  template: "C11";
  weekEnding: string;
  /** One row per topic in this company's own parent-link set, sorted by stories this week. */
  rows: { topic: string; stories: number; median: number | null; top: { headline: string; date: string } | null }[];
  /** Shown under the table when a median is missing (twelve weeks of tags not yet backfilled). */
  medianNote?: string;
};

export type PageContent =
  | C01Content
  | C02Content
  | C03Content
  | C04Content
  | C05Content
  | C06Content
  | C07Content
  | C08Content
  | C09Content
  | C10Content
  | C11Content;
