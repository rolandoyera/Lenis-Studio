"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

interface TransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  style?: React.CSSProperties;
}

export default function TransitionLink({
  href,
  children,
  className,
  "aria-label": ariaLabel,
  style,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const hrefStr = typeof href === "string" ? href : href.pathname || "";

    // Fallback if browser doesn't support View Transitions API
    if (!document.startViewTransition) {
      router.push(hrefStr);
      return;
    }

    document.startViewTransition(() => {
      return new Promise<void>((resolve) => {
        router.push(hrefStr);

        // Deterministically wait for Next.js to update the DOM
        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Safety fallback timeout to prevent UI freezes
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 1500);
      });
    });
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      aria-label={ariaLabel}
      style={style}
      {...props}
    >
      {children}
    </Link>
  );
}
