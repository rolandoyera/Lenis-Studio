"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { ArrowLeft, Plus, Printer, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  formatProjectAddress,
  getClient,
  getOrganization,
  getProjects,
} from "@/lib/db";
import type { Client, Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { getClientName } from "../../clients/_components/client-name";
import {
  boldText,
  CURRENCY_TOKENS,
  type FieldDef,
  FIELD_DEFS,
  formatClientAddress,
  formatCompanyAddress,
  formatPlainDate,
  SEGMENT_SPLIT_RE,
  TEMPLATE_PAGES,
  tokenName,
} from "./contract-template";

interface ScopeItem {
  id: string;
  value: string;
}

/** A client's display name — company name for orgs, full name otherwise. */
function clientDisplayName(client: Client): string {
  if (client.isCompany && client.company?.trim()) return client.company.trim();
  const { firstName, lastName } = getClientName(client);
  return `${firstName} ${lastName}`.trim();
}

/** Label/control pair. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Inline render of one line: swap {{TOKEN}} markers and **bold** runs. */
function renderSegments(text: string, resolved: Record<string, string>) {
  return text.split(SEGMENT_SPLIT_RE).map((part, i) => {
    const bold = boldText(part);
    if (bold) {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
        <span key={i} className="font-semibold text-foreground">
          {bold}
        </span>
      );
    }
    const name = tokenName(part);
    if (!name) {
      // Plain text segment.
      // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
      return <span key={i}>{part}</span>;
    }
    const value = resolved[name];
    const def = FIELD_DEFS[name];
    if (value) {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
        <span key={i} className="font-black text-foreground">
          {value}
        </span>
      );
    }
    return (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
        key={i}
        className="contract-placeholder rounded bg-yellow-100 px-1.5 py-0.5 font-semibold text-[13px] text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300"
      >
        {def?.label ?? name}
      </span>
    );
  });
}

/** True for a line that is a single all-caps bold run — a centered heading. */
function isHeadingLine(line: string): boolean {
  const inner = boldText(line.trim());
  return inner !== null && inner === inner.toUpperCase() && /[A-Z]/.test(inner);
}

/** Render a page body line-by-line so all-caps bold headings can center. */
function DocumentBody({
  body,
  resolved,
}: {
  body: string;
  resolved: Record<string, string>;
}) {
  return (
    <div className="font-contract text-[15px] text-foreground/70 leading-7">
      {body.split("\n").map((line, i) => (
        <p
          // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
          key={i}
          className={`whitespace-pre-wrap${isHeadingLine(line) ? " text-center" : ""}`}
        >
          {line ? renderSegments(line, resolved) : " "}
        </p>
      ))}
    </div>
  );
}

/** The right input control for a page-scoped field. */
function PageFieldInput({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  if (def.type === "textarea") {
    return (
      <Textarea
        placeholder={def.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (def.type === "currency") {
    return (
      <Input
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <Input
      placeholder={def.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Exhibit A scope-of-work editor: a labelled list with add + remove controls. */
function ScopeListField({
  label,
  placeholder,
  items,
  onAdd,
  onRemove,
  onChange,
}: {
  label: string;
  placeholder?: string;
  items: ScopeItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              placeholder={placeholder ?? `Item ${i + 1}`}
              value={item.value}
              onChange={(e) => onChange(item.id, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove item</span>
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={onAdd}
      >
        <Plus className="size-4" />
        Add item
      </Button>
    </div>
  );
}

/** Today as a `YYYY-MM-DD` string in local time (for the date input default). */
function todayIso(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Pre-filled defaults — all editable. */
const DEFAULT_VALUES: Record<string, string> = {
  EFFECTIVE_DATE: todayIso(),
  BILLABLE_RATE: "450",
  STYLING_FEE: "7500",
  MONTHLY_ADMINISTRATION_FEE: "3000",
};

export function ContractBuilder() {
  const { organizationId } = useAuth();
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...DEFAULT_VALUES,
  }));
  const [activePage, setActivePage] = useState(1);
  // Projects (and their client) are read from the CRM — no inline creation here.
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  // Firm-side values read from the org's company profile (legal name + address +
  // email) and branding (dark logo shown atop the document).
  const [company, setCompany] = useState({
    legalName: "",
    address: "",
    email: "",
    logoDarkUrl: "",
  });
  // Exhibit A scope of work — a dynamic, add/remove list (starts with one row).
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>(() => [
    { id: crypto.randomUUID(), value: "" },
  ]);

  const addScopeItem = () =>
    setScopeItems((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
  const removeScopeItem = (id: string) =>
    setScopeItems((prev) => prev.filter((item) => item.id !== id));
  const updateScopeItem = (id: string, value: string) =>
    setScopeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item)),
    );

  const pageEls = useRef<Map<number, HTMLElement>>(new Map());

  // Pull the firm's legal identity from the org company profile.
  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    void getOrganization(organizationId)
      .then((org) => {
        if (!active || !org) return;
        const cp = org.companyProfile;
        setCompany({
          legalName: cp?.legalName ?? cp?.displayName ?? "",
          address: formatCompanyAddress(cp?.address),
          email: cp?.email ?? "",
          logoDarkUrl: org.branding?.logoDarkUrl ?? "",
        });
      })
      .catch(() => {
        // Non-fatal: firm fields fall back to empty placeholders.
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  // Pull the org's projects for the picker.
  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    void getProjects(organizationId)
      .then((list) => {
        if (active) setProjects(list);
      })
      .catch(() => {
        // Non-fatal: the picker just stays empty.
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const selectedProject = projects.find(
    (p) => p.projectId === selectedProjectId,
  );

  // Load the selected project's client (the doc needs the client name/contact).
  useEffect(() => {
    if (!selectedProject) {
      setClient(null);
      return;
    }
    let active = true;
    void getClient(selectedProject.clientId)
      .then((c) => {
        if (active) setClient(c);
      })
      .catch(() => {
        if (active) setClient(null);
      });
    return () => {
      active = false;
    };
  }, [selectedProject]);

  const setValue = (token: string, value: string) =>
    setValues((prev) => ({ ...prev, [token]: value }));

  // Track which page is centered in the viewport to drive the left panel.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          );
        const top = visible[0];
        if (top) {
          setActivePage(Number(top.target.getAttribute("data-page")));
        }
      },
      // A thin band near the upper third — the page crossing it is "active".
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    for (const el of pageEls.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Resolve raw inputs into the display values rendered in the document.
  const resolved = useMemo(() => {
    const r: Record<string, string> = {};
    for (const def of Object.values(FIELD_DEFS)) {
      r[def.token] = values[def.token] ?? "";
    }
    // Project + client are pulled from the CRM record (read-only here).
    r.PROJECT_ADDRESS = selectedProject
      ? (selectedProject.address ?? formatProjectAddress(selectedProject))
      : "";
    r.CLIENT_NAME = client ? clientDisplayName(client) : "";
    r.CLIENT_ADDRESS = client ? formatClientAddress(client) : "";
    r.CLIENT_EMAIL = client?.email ?? "";
    r.COMPANY_LEGAL_NAME = company.legalName;
    r.COMPANY_ADDRESS = company.address;
    r.COMPANY_EMAIL = company.email;
    r.EFFECTIVE_DATE = formatPlainDate(values.EFFECTIVE_DATE);
    for (const t of CURRENCY_TOKENS) {
      r[t] = values[t]
        ? formatCurrency(Number(values[t]) || 0, { noDecimals: true })
        : "";
    }
    // Exhibit A bullet list — one "•  item" line per filled scope row.
    r.SCOPE_ITEMS = scopeItems
      .map((item) => item.value.trim())
      .filter(Boolean)
      .map((text) => `•  ${text}`)
      .join("\n");
    return r;
  }, [values, selectedProject, client, company, scopeItems]);

  const activeFields = Object.values(FIELD_DEFS).filter(
    (d) => d.scope === "page" && d.page === activePage && d.type !== "auto",
  );
  const totalPages = TEMPLATE_PAGES.length;

  // Required fields still empty.
  const missingFields = useMemo(
    () =>
      Object.values(FIELD_DEFS)
        .filter((def) => !def.optional && !(resolved[def.token] ?? "").trim())
        .map((def) => ({ label: def.label, page: def.page ?? 1 }))
        .sort((a, b) => a.page - b.page),
    [resolved],
  );

  // Gate save/send/print on a complete document; otherwise jump to the first gap.
  const guard = (actionLabel: string, run: () => void) => {
    if (missingFields.length > 0) {
      const first = missingFields[0];
      const count = missingFields.length;
      toast.error(`Complete all fields before you ${actionLabel}.`, {
        description: `${count} field${count > 1 ? "s" : ""} still need attention, starting with “${first.label}”.`,
      });
      setActivePage(first.page);
      pageEls.current
        .get(first.page)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    run();
  };

  return (
    <div className="flex w-full flex-col gap-6 lg:h-[calc(100svh-var(--dashboard-header-height)-3rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:shrink-0">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard/contracts"
            className="flex w-fit items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Contracts
          </Link>
          <h1 className="font-heading font-semibold text-2xl">New Contract</h1>
          <p className="text-muted-foreground text-sm">
            Fill in the highlighted fields — the document updates as you go.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-start">
          <Button variant="outline" asChild>
            <Link href="/dashboard/contracts">Cancel</Link>
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => guard("print", () => window.print())}
          >
            <Printer className="size-4" />
            Print / PDF
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              guard("save the draft", () => toast.success("Draft saved."))
            }
          >
            <Save className="size-4" />
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() =>
              guard("send", () => toast.success("Contract sent to the client."))
            }
          >
            <Send className="size-4" />
            Send
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Contract Details (pinned globals + active-page fields) */}
        <Card variant="panel" className="lg:min-h-0">
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 lg:min-h-0 lg:flex-1">
            {/* Pinned global fields — always visible (frozen zone) */}
            <div className="flex flex-col gap-5 lg:shrink-0">
              <Field label="Project">
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        projects.length
                          ? "Select a project"
                          : "No projects in the CRM yet"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.projectId} value={p.projectId}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedProject && (
                <div className="-mt-2 flex flex-col gap-0.5 text-muted-foreground text-xs">
                  {resolved.CLIENT_NAME && (
                    <span className="text-foreground">
                      {resolved.CLIENT_NAME}
                    </span>
                  )}
                  {resolved.PROJECT_ADDRESS && (
                    <span>{resolved.PROJECT_ADDRESS}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Firm Legal Name</Label>
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-border border-dashed bg-muted/40 px-3 text-muted-foreground text-sm">
                    <span className="truncate">
                      {company.legalName || "Not set in Company Profile"}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider">
                      Auto
                    </span>
                  </div>
                </div>
                <Field label="Effective Date">
                  <Input
                    type="date"
                    value={values.EFFECTIVE_DATE ?? ""}
                    onChange={(e) => setValue("EFFECTIVE_DATE", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <Separator className="lg:shrink-0" />

            {/* Active-page fields — swap as the user scrolls (scrolling zone) */}
            <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
              <div className="flex items-center justify-between lg:shrink-0">
                <span className="font-semibold text-foreground text-sm">
                  Fields to Populate
                </span>
                <span className="text-muted-foreground text-xs">
                  Page {activePage} of {totalPages}
                </span>
              </div>

              <div className="lg:min-h-0 lg:flex-1 lg:pb-1">
                {activeFields.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    {activeFields.map((def) =>
                      def.type === "list" ? (
                        <ScopeListField
                          key={def.token}
                          label={def.label}
                          placeholder={def.placeholder}
                          items={scopeItems}
                          onAdd={addScopeItem}
                          onRemove={removeScopeItem}
                          onChange={updateScopeItem}
                        />
                      ) : (
                        <Field key={def.token} label={def.label}>
                          <PageFieldInput
                            def={def}
                            value={values[def.token] ?? ""}
                            onChange={(v) => setValue(def.token, v)}
                          />
                        </Field>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="rounded-lg border border-border border-dashed bg-muted/20 p-4 text-center text-muted-foreground text-sm">
                    No fields on this page — keep scrolling for more fields.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: the paged document (scroll area on screen, A4 sheets on print) */}
        <div className="contract-print-area flex flex-col gap-6 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-[55vh]">
          {TEMPLATE_PAGES.map((page) => (
            <div
              key={page.page}
              data-page={page.page}
              ref={(el) => {
                if (el) pageEls.current.set(page.page, el);
                else pageEls.current.delete(page.page);
              }}
              className={`contract-sheet relative scroll-mt-6 rounded-xl border bg-background p-8 transition-colors sm:p-10 ${
                page.page === activePage
                  ? "border-primary/40 shadow-lg ring-1 ring-primary/20"
                  : "border-border"
              }`}
            >
              {/* Editing-only page marker — hidden when printing. */}
              <span className="contract-page-meta absolute top-3 right-4 text-muted-foreground/70 text-xs">
                {page.page} / {totalPages}
              </span>
              {/* Firm dark logo as the document letterhead (page 1 only). */}
              {page.page === 1 && company.logoDarkUrl && (
                // biome-ignore lint/performance/noImgElement: document letterhead uses a dynamic branding URL.
                <img
                  src={company.logoDarkUrl}
                  alt={company.legalName || "Firm logo"}
                  className="mx-auto mb-8 h-32 w-auto object-contain"
                />
              )}
              <DocumentBody body={page.body} resolved={resolved} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
