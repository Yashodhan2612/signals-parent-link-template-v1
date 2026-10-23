import type { PageContent } from "@/content/types";
import { C01 } from "./C01";
import { C02 } from "./C02";
import { C03 } from "./C03";
import { C04 } from "./C04";
import { C05 } from "./C05";
import { C06 } from "./C06";
import { C07 } from "./C07";
import { C08 } from "./C08";
import { C09 } from "./C09";
import { C10 } from "./C10";
import { C11 } from "./C11";

export type TemplateLinks = {
  /** C10 only: tracked rotation link to a peer's own C10 page, or null when that peer has none live. */
  peerHref: (companyId: string) => string | null;
};

/**
 * One template per category; S12-S15 links render with the template their company record names.
 * Adding a template = a content type in content/types.ts, a component here, and an entry in content/taxonomy.ts.
 */
export function Template({ page, links, today }: { page: PageContent; links: TemplateLinks; today: string }) {
  switch (page.template) {
    case "C01":
      return <C01 page={page} />;
    case "C02":
      return <C02 page={page} />;
    case "C03":
      return <C03 page={page} />;
    case "C04":
      return <C04 page={page} />;
    case "C05":
      return <C05 page={page} />;
    case "C06":
      return <C06 page={page} />;
    case "C07":
      return <C07 page={page} today={today} />;
    case "C08":
      return <C08 page={page} />;
    case "C09":
      return <C09 page={page} />;
    case "C10":
      return <C10 page={page} peerHref={links.peerHref} />;
    case "C11":
      return <C11 page={page} />;
  }
}
