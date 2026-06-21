import { Badge } from "@/components/ui/badge";

/** One labelled swatch: the rendered element above its source/usage note. */
function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4">
      <div className="flex min-h-6 items-center">{children}</div>
      <code className="text-[11px] text-muted-foreground">{label}</code>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-sm">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

/**
 * Gallery of every sanctioned `Badge` variant plus the restyled patterns that
 * actually appear across the app, so they can be reviewed in one place.
 */
export function BadgeGallery() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="Variants">
        <Swatch label='variant="default"'>
          <Badge>Default</Badge>
        </Swatch>
        <Swatch label='variant="secondary"'>
          <Badge variant="secondary">Secondary</Badge>
        </Swatch>
        <Swatch label='variant="outline"'>
          <Badge variant="outline">Outline</Badge>
        </Swatch>
        <Swatch label='variant="ghost"'>
          <Badge variant="ghost">Ghost</Badge>
        </Swatch>
        <Swatch label='variant="destructive"'>
          <Badge variant="destructive">Destructive</Badge>
        </Swatch>
        <Swatch label='variant="success"'>
          <Badge variant="success">Success</Badge>
        </Swatch>
        <Swatch label='variant="warning"'>
          <Badge variant="warning">Warning</Badge>
        </Swatch>
        <Swatch label='variant="link"'>
          <Badge variant="link">Link</Badge>
        </Swatch>
      </Section>

      <Section title="Restyled patterns in the app">
        <Swatch label="Uppercase primary tag">
          <Badge className="border border-primary/20 bg-primary/10 text-primary uppercase">
            New
          </Badge>
        </Swatch>
        <Swatch label="Uppercase muted tag">
          <Badge className="border border-muted-foreground/20 bg-muted/10 text-muted-foreground uppercase">
            Draft
          </Badge>
        </Swatch>
        <Swatch label="Overlay (on imagery)">
          <Badge className="flex items-center gap-2 bg-black/55 text-white uppercase backdrop-blur-xs">
            Featured
          </Badge>
        </Swatch>
      </Section>
    </div>
  );
}
