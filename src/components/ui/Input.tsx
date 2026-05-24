import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}

export default function Input({ className, ...props }: InputProps) {
    return (
        <input {...props} className={cn("flex h-10 w-full rounded-lg border-b border-border/50 focus:border-accent/50 focus:border-b-2 px-3 py-2 text-base ring-offset-background placeholder:text-foreground placeholder:font-light focus-visible:outline-none ring-2 ring-ring ring-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50", className)} />

    );
}