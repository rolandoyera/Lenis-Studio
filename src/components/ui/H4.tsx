import { cn } from "@/lib/utils";

interface H4Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export default function H4({ children, className, ...props }: H4Props) {
  return (
    <h4
      {...props}
      className={cn(
        "text-[16px] lg:text-[18px] font-normal text-balance text-foreground leading-1.2",
        className,
      )}>
      {children}
    </h4>
  );
}
