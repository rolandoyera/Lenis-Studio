import { cn } from "@/lib/utils";

interface H2Props extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

export default function H2({ children, className, ...props }: H2Props) {
    return (
        <h1 {...props} className={cn("text-4xl lg:text-7xl font-normal text-balance tracking-tight", className)}>
            {children}
        </h1>
    );
}