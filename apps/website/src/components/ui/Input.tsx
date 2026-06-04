import * as React from "react";
import { cn } from "@/lib/utils";
import DoubleBorder from "./DoubleBorder";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({
  className,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className="relative w-full">
      <input
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "flex h-11 w-full bg-transparent border-none px-2 py-2 text-base placeholder:text-muted-foreground placeholder:font-light focus-visible:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-taupe-800",
          className,
        )}
      />
      <DoubleBorder
        left="left-0"
        borderColor={isFocused ? "bg-accent" : "bg-border/30"}
        className="transition-all duration-300"
      />
    </div>
  );
}
