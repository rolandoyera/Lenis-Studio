import { cn } from "@/lib/utils";

interface H2Props extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

export default function H2({ children, className, ...props }: H2Props) {
    return (
        <h1 {...props} className={cn("text-4xl lg:text-6xl font-normal text-balance leading-snug tracking-tighter", className)}>
            {children}
        </h1>
    );
}