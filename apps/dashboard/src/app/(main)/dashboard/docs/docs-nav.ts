/**
 * Client-safe Docs nav helpers. The actual list is built from each doc's YAML
 * frontmatter at request time — see `docs-nav.server.ts` (`getDocsNav`).
 */
export interface DocsNavItem {
  title: string;
  /** URL path under /dashboard/docs ("" = the Docs overview index). */
  slug: string;
}

export const docsHref = (slug: string) =>
  slug ? `/dashboard/docs/${slug}` : "/dashboard/docs";
