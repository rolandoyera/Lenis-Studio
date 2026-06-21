import { DocsSidebarNav } from "./_components/docs-sidebar-nav";
import { getDocsNav } from "./docs-nav.server";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const items = getDocsNav();

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 p-6">
      <aside className="hidden w-48 shrink-0 md:block">
        <div className="sticky top-6">
          <DocsSidebarNav items={items} />
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
