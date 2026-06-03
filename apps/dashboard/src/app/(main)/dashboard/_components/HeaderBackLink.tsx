"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HeaderBackLink({ href = "/dashboard/home" }: { href?: string } = {}) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept if there's history to go back to (i.e. they didn't land here directly)
    if (typeof window !== "undefined" && window.history.length > 1) {
      // Standard left click with no modifier keys
      if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        router.back();
      }
    }
  };

  return (
    <div>
      <Link href={href ?? "#"} onClick={handleBack} prefetch={false}>
        <Button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 bg-transparent hover:bg-transparent cursor-pointer">
          <ArrowLeft className="size-3.5" />
          Go Back
        </Button>
      </Link>
    </div>
  );
}
