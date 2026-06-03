import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HeaderBackLink({ page, href }: { page: React.ReactNode; href: string }) {
  return (
    <div>
      <Link href={href ?? "#"} prefetch={false}>
        <Button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 bg-transparent hover:bg-transparent cursor-pointer">
          <ArrowLeft className="size-3.5" />
          Back to {page}
        </Button>
      </Link>
    </div>
  );
}
