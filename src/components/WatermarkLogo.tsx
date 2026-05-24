interface WatermarkLogoProps {
  className?: string;
  size?: number | string;
  opacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  maskUrl?: string;
  rotation?: number;
}

export default function WatermarkLogo({
  className = "",
  size = 300,
  opacity = 0.5,
  gradientFrom = "var(--taupe-800)",
  gradientTo = "var(--ink-900)",
  maskUrl = "/assets/logo_sdg-S-only.svg",
  rotation = 0,
}: WatermarkLogoProps) {
  const sizeValue = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`absolute pointer-events-none z-0 ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
        opacity,
        background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
        maskImage: `url(${maskUrl})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${maskUrl})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        rotate: rotation !== 0 ? `${rotation}deg` : undefined,
      }}
    />
  );
}
