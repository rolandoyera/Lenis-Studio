import { cn } from "@/lib/utils";

interface DataFieldProps {
  /** The field caption (e.g. "Primary Address"). */
  label: React.ReactNode;
  /** The field value — any node. Falsy/empty renders the `empty` placeholder. */
  children?: React.ReactNode;
  /** Placeholder shown when there's no value (e.g. "Not provided", "Not set"). */
  empty?: string;
  className?: string;
  labelClassName?: string;
}

/** A value is "missing" when it's null, undefined, false, or an empty string. */
function isEmpty(value: React.ReactNode) {
  return value == null || value === false || value === "";
}

/**
 * Read-only label/value pair for display cards. Built on `<dl>/<dt>/<dd>` so the
 * label→value relationship is semantic and the caption stays selectable —
 * unlike the form-oriented `Label`/`Field` components, which render a `<label>`
 * with `select-none`. When the value is missing, the `empty` placeholder is
 * shown so each field can phrase its own null state ("Not set", "Unassigned",
 * …). Prototype lives here while we settle the card theme; promote to
 * `components/ui` once it's proven.
 */
export function DataField({
  label,
  children,
  empty = "—",
  className,
  labelClassName,
}: DataFieldProps) {
  return (
    <dl
      className={cn(
        "flex flex-col gap-2 bg-red-500/10 min-h-[40px]",
        className,
      )}>
      <dt
        className={cn(
          "flex items-center gap-2 text-muted-foreground text-xs uppercase leading-none tracking-wider",
          labelClassName,
        )}>
        {label}
      </dt>
      <dd>
        {isEmpty(children) ? (
          <span className="text-muted-foreground text-xs font-light italic">
            {empty}
          </span>
        ) : (
          children
        )}
      </dd>
    </dl>
  );
}
