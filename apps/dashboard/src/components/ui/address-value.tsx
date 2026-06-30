import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressValueProps {
  /**
   * Structured US-style address. `street` is line 1; `city`/`state`/`zip` are
   * combined into line 2 ("City, ST 00000"). Ignored when `lines` is given.
   */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  /** Pre-formatted address lines (e.g. international). Overrides `address`. */
  lines?: string[];
  /** Google Maps query. Defaults to the address joined by ", ". */
  query?: string;
  /** Maps link text. */
  mapsLabel?: string;
  className?: string;
}

/**
 * Read-only address block: stacked address lines plus a "google maps" link.
 * Renders `null` when there's nothing to show, so dropping it inside a
 * `DataField` lets that component's `empty` placeholder take over. Pass a
 * structured `address` for US-style records (street + city/state/zip) or
 * pre-formatted `lines` + `query` for already-formatted addresses.
 */
export function AddressValue({
  address,
  lines,
  query,
  mapsLabel = "google maps",
  className,
}: AddressValueProps) {
  const cityStateZip = [
    address?.city,
    [address?.state, address?.zip].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const displayLines = (lines ?? [address?.street, cityStateZip]).filter(
    (line): line is string => Boolean(line),
  );

  if (displayLines.length === 0) {
    return null;
  }

  const mapsQuery =
    query ??
    (lines
      ? displayLines.join(", ")
      : [address?.street, address?.city, address?.state, address?.zip]
          .filter(Boolean)
          .join(", "));

  return (
    <div className={cn("flex flex-col", className)}>
      {displayLines.map((line, i) => (
        <span key={line} className={i > 0 ? "mt-0.5" : undefined}>
          {line}
        </span>
      ))}
      {mapsQuery && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 flex w-fit items-center gap-1 text-primary text-xs hover:underline"
        >
          {mapsLabel}
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
