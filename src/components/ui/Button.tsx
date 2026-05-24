// components/ui/Button.tsx
import type {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  AnchorHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MoveRight } from "lucide-react";


type ButtonBaseProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

type ButtonAsButton = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> &
  ButtonBaseProps & { href?: undefined };

type ButtonAsLink = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> &
  ButtonBaseProps & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  children,
  className,
  href,
  icon,
  ...props
}: ButtonProps) {
  const baseClasses = cn(
    "group flex gap-2 items-center justify-center border-0 cursor-pointer py-3 px-4 rounded-sm bg-brand text-white font-medium duration-200 active:translate-y-px text-[18px] focus-visible:ring-2 focus-visible:ring-[#c9b49a] focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all hover:shadow hover:shadow-black/50",
    className,
  );

  if (href) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { href: _, ...linkProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={baseClasses} {...linkProps}>
        <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
          {children}
        </span>
        <MoveRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    );
  }

  // TypeScript now knows this is the button variant
  const buttonProps = props as ButtonAsButton;
  return (
    <button className={baseClasses} {...buttonProps}>
      <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
        {children}
      </span>
      <MoveRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 mt-0.5" />
    </button>
  );
}
