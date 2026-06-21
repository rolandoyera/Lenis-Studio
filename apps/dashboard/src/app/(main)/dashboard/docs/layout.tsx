import { DocsSidebarNav } from "./_components/docs-sidebar-nav";
import { getDocsNav } from "./docs-nav.server";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const items = getDocsNav();

  return (
    <div className="relative w-full p-6">
      <aside className="absolute inset-y-6 left-6 hidden w-48 md:block">
        <div className="sticky top-6">
          <DocsSidebarNav items={items} />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-[1320px]">{children}</main>
    </div>
  );
}
