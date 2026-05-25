import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ArrowButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  direction?: "left" | "right";
  variant?: "primary" | "secondary";
}

export default function ArrowButton({
  children,
  className,
  href,
  onClick,
  type = "button",
  direction = "right",
  variant = "primary",
  ...props
}: ArrowButtonProps) {
  const classes = cn(
    "group inline-flex h-12 items-center gap-2.5 rounded-lg text-cream-100",
    variant === "primary" ? "bg-accent hover:bg-taupe-800" : "bg-taupe-800 hover:bg-accent",
    direction === "right" ? "pl-[22px] pr-[18px]" : "pl-[18px] pr-[22px]",
    "text-lg font-medium uppercase",
    "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent hover:cursor-pointer hover:shadow hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-275 ease-[cubic-bezier(.6,.2,.1,1)]",
    className,
  );

  const arrow = (
    <span className="relative block h-4 w-4 overflow-hidden">
      <Arrow
        direction={direction}
        className={cn(
          "absolute inset-0 transition-transform duration-250 ease-[cubic-bezier(.6,.2,.1,1)]",
          direction === "right"
            ? "group-hover:translate-x-full group-hover:-translate-y-full"
            : "group-hover:-translate-x-full group-hover:-translate-y-full",
        )}
      />
      <Arrow
        direction={direction}
        className={cn(
          "absolute inset-0 transition-transform duration-250 ease-[cubic-bezier(.6,.2,.1,1)]",
          direction === "right"
            ? "-translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0"
            : "translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0",
        )}
      />
    </span>
  );

  const inner = (
    <>
      {direction === "left" && arrow}
      {children}
      {direction === "right" && arrow}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as any)}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...props}>
      {inner}
    </button>
  );
}

function Arrow({
  className,
  direction = "right",
}: {
  className?: string;
  direction?: "left" | "right";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true">
      {direction === "right" ? (
        <path d="M5 19L19 5M19 5H8M19 5V16" />
      ) : (
        <path d="M19 19L5 5M5 5H16M5 5V16" />
      )}
    </svg>
  );
}
