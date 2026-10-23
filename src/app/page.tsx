import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PREVIEW } from "@/config/site";
import { CATEGORIES, TEMPLATE_CODES } from "@/content/taxonomy";
import { pagePath, quarterOf } from "@/lib/links";

/** Preview-only menu (SIGNALS_PREVIEW=1): one working link per template, for the first placeholder company. */
export default function TemplateMenu() {
  if (!PREVIEW) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="serif text-4xl">Parent page templates</h1>
      <p className="mt-2 text-sm text-muted">
        C01 to C11 templates where all company specific content is lorem ipsum.
      </p>
      <Suspense>
        <Menu />
      </Suspense>
    </div>
  );
}

async function Menu() {
  await connection(); // the link's quarter is today's
  const quarter = quarterOf(new Date());
  return (
    <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-card">
      {TEMPLATE_CODES.map((code) => (
        <li key={code}>
          <a
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-cream-2"
            href={pagePath({ quarter, product: "dsr", issue: "preview", company: "lorem-a", code, platform: "lexisnexis", placement: "block" })}
          >
            <span className="tnum text-sm font-semibold text-accent-2">{code}</span>
            <span>{CATEGORIES[code].title}</span>
            <span className="ml-auto text-muted" aria-hidden>
              →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
