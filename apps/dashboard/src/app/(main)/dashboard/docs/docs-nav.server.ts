import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { cache } from "react";

import type { DocsNavItem } from "./docs-nav";

const DOCS_DIR = path.join(process.cwd(), "src/app/(main)/dashboard/docs");

/**
 * Builds the Docs nav by scanning each `<slug>/page.mdx` and reading its YAML
 * frontmatter (`title`, `order`). Add a doc by dropping in the file — no manual
 * list to maintain. The Overview index is always first.
 */
export const getDocsNav = cache((): DocsNavItem[] => {
  const docs: (DocsNavItem & { order: number })[] = [];

  for (const entry of fs.readdirSync(DOCS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;

    const mdxPath = path.join(DOCS_DIR, entry.name, "page.mdx");
    if (!fs.existsSync(mdxPath)) continue;

    const { data } = matter(fs.readFileSync(mdxPath, "utf8"));
    docs.push({
      slug: entry.name,
      title: typeof data.title === "string" ? data.title : entry.name,
      order: typeof data.order === "number" ? data.order : 999,
    });
  }

  docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  return [
    { title: "Overview", slug: "" },
    ...docs.map(({ order: _order, ...item }) => item),
  ];
});
