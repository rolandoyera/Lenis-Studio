import { cn } from "@/lib/utils";

interface PProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export default function P({ children, className, ...props }: PProps) {
  return (
    <p
      {...props}
      className={cn(
        "text-base lg:text-[22px] font-light text-balance -mb-4 leading-[1.55]",
        className,
      )}>
      {children}
    </p>
  );
}
