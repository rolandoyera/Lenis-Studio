import { cn } from "@/lib/utils";

interface DoubleBorderProps {
  className?: string;
  position?: "top" | "bottom";
  left?: string;
  right?: string;
  borderColor?: string;
  highlightColor?: string;
}

export default function DoubleBorder({
  className,
  position = "bottom",
  left = "left-0",
  right = "right-0",
  borderColor = "bg-border/80",
  highlightColor = "bg-white",
}: DoubleBorderProps) {
  const isBottom = position === "bottom";

  return (
    <>
      <div
        className={cn(
          "absolute h-px",
          left,
          right,
          isBottom ? "bottom-0" : "top-0",
          borderColor,
          className
        )}
      />
      <div
        className={cn(
          "absolute h-px",
          left,
          right,
          isBottom ? "-bottom-px" : "-top-px",
          highlightColor,
          className
        )}
      />
    </>
  );
}
