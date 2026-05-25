import { cn } from "@/lib/utils";

interface H3Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export default function H3({ children, className, ...props }: H3Props) {
  return (
    <h3
      {...props}
      className={cn(
        "text-2xl lg:text-4xl font-normal text-balance tracking-tighter text-foreground",
        className,
      )}>
      {children}
    </h3>
  );
}
