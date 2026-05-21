import { cn } from "@/lib/utils";

interface H2Props extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

export default function H2({ children, className, ...props }: H2Props) {
    return (
        <h2 {...props} className={cn("text-4xl lg:text-6xl font-medium text-white text-balance leading-snug tracking-tight", className)}>
            {children}
        </h2>
    );
}