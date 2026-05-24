import { cn } from "@/lib/utils";

interface H2Props extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

export default function H2({ children, className, ...props }: H2Props) {
    return (
        <h2 {...props} className={cn("text-3xl lg:text-5xl font-normal text-balance tracking-tighter text-foreground", className)}>
            {children}
        </h2>
    );
}