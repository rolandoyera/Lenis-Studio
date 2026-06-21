import Link from "next/link";

import { H1 } from "@/components/ui/typography";

import { docsHref } from "./docs-nav";
import { getDocsNav } from "./docs-nav.server";

export default function Page() {
  const pages = getDocsNav().filter((item) => item.slug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <H1>Docs</H1>
        <p className="mt-1 text-muted-foreground text-sm">
          Documentation and reference material.
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {pages.map((item) => (
          <li key={item.slug}>
            <Link
              href={docsHref(item.slug)}
              className="text-primary text-sm hover:underline"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
