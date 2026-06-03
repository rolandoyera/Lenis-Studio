"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  Activity,
  ArrowLeft,
  Code,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { H1 } from "@/components/ui/typography";
import { clearDiagnosticRuns, getDiagnosticRuns } from "@/lib/db";
import type { DiagnosticRun } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const TABS = [
  { id: "extracted", label: "Selected Fields", icon: Eye },
  { id: "markdown", label: "Scraped Markdown", icon: FileText },
  { id: "prompt", label: "Exact LLM Prompt", icon: Code },
  { id: "raw", label: "Raw AI JSON", icon: Database },
];

export default function DiagnosticsPage() {
  const [runs, setRuns] = useState<DiagnosticRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<DiagnosticRun | null>(null);
  const [activeTab, setActiveTab] = useState("extracted");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // Fetch runs on mount
  async function loadRuns(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await getDiagnosticRuns();
      setRuns(data);
      if (data.length > 0 && !selectedRun) {
        setSelectedRun(data[0]);
      } else if (data.length > 0 && selectedRun) {
        // Keep selection updated
        const updated = data.find((r) => r.runId === selectedRun.runId);
        if (updated) setSelectedRun(updated);
      } else {
        setSelectedRun(null);
      }
    } catch (error) {
      console.error("Failed to load diagnostic logs:", error);
      toast.error("Failed to fetch diagnostics from Firestore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRuns();
  }, []);

  // Wipes temporary collection
  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete all diagnostic history?")) return;
    setClearing(true);
    try {
      await clearDiagnosticRuns();
      setRuns([]);
      setSelectedRun(null);
      toast.success("Diagnostic logs wiped successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear diagnostic logs.");
    } finally {
      setClearing(false);
    }
  };

  const getDomainName = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.hostname.replace("www.", "");
    } catch {
      return urlString;
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1 uppercase tracking-wider">
            <Activity className="size-4 animate-pulse" />
            AI Diagnostic Console
          </div>
          <H1>Logs & Extraction Diagnostics</H1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time inspection center showing scraped markdown data, prompts, and raw JSON returned by Luna.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => loadRuns(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh Logs
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={clearing || runs.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="size-4" />
            Clear History
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <RefreshCw className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Querying Diagnostic Log Runs
          </p>
        </div>
      ) : runs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[350px] border-dashed text-center p-8 bg-background/30 backdrop-blur-xs">
          <Activity className="size-16 text-muted-foreground/35 mb-4 animate-pulse" />
          <h3 className="font-heading font-semibold text-xl">No Diagnostic Runs Found</h3>
          <p className="text-muted-foreground text-sm max-w-md mt-2 leading-relaxed">
            Run an AI Product Autofill from a webpage link or AI Vendor Autofill from a domain homepage, and your
            telemetry logs will populate here automatically.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <Button asChild variant="outline">
              <Link href="/dashboard/library">
                <ArrowLeft className="size-4 mr-2" />
                Go to Product Library
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/vendors">Go to Vendors</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Historical Run Selector */}
          <div className="lg:col-span-4 flex flex-col gap-3 max-h-[750px] overflow-y-auto pr-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
              Captured Sessions ({runs.length})
            </h3>
            {runs.map((run) => {
              const active = selectedRun?.runId === run.runId;
              const domain = getDomainName(run.url);

              return (
                <Card
                  key={run.runId}
                  onClick={() => setSelectedRun(run)}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:border-primary/30 py-3.5",
                    active
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "bg-card/40 hover:bg-card/75",
                  )}
                >
                  <CardContent className="flex flex-col gap-2.5 p-0">
                    <div className="flex items-center justify-between w-full">
                      <Badge
                        variant={run.type === "product" ? "default" : "secondary"}
                        className="text-[9px] font-extrabold uppercase tracking-wider"
                      >
                        {run.type === "product" ? "Product Autofill" : "Vendor Profile"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {formatTimestamp(run.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-heading font-semibold text-sm truncate text-foreground group-hover:text-primary">
                        {run.parsedData?.name || "Unnamed Entity"}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Globe className="size-3 shrink-0" />
                        {domain}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* RIGHT PANEL: Live Inspector Console */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Header info of active inspect target */}
            {selectedRun && (
              <Card className="bg-card/40 backdrop-blur-xs">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-0">
                  <div>
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">
                      Active Inspector Target
                    </span>
                    <h2 className="font-heading font-bold text-lg text-foreground mt-0.5">
                      {selectedRun.parsedData?.name || "Unnamed"}
                    </h2>
                    <a
                      href={selectedRun.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1.5 mt-1"
                    >
                      <Globe className="size-3" />
                      {selectedRun.url}
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 font-semibold text-xs border-border">
                      ID: {selectedRun.runId}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab navigation */}
            <div className="flex border-b border-border gap-1 overflow-x-auto">
              {TABS.map((tab) => {
                const ActiveIcon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                      active
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30",
                    )}
                  >
                    <ActiveIcon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab contents panel */}
            <div className="min-h-[480px]">
              {/* TAB 1: Extracted Fields UI Showcase */}
              {activeTab === "extracted" && selectedRun && (
                <div className="flex flex-col gap-6">
                  {/* Detailed Field Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Basic Meta Fields */}
                    <Card className="bg-card/50">
                      <CardHeader className="border-b border-border/30 pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <ShoppingBag className="size-4 text-primary" />
                          Brand & Category Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 mt-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Extracted Name
                          </span>
                          <div className="h-5 flex items-center">
                            <span className="text-sm font-semibold text-foreground">
                              {selectedRun.parsedData?.name || (
                                <em className="text-muted-foreground/50">Not extracted</em>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Matched Category
                          </span>
                          <div className="h-5 flex items-center">
                            {selectedRun.parsedData?.category ? (
                              <Badge className="font-bold text-[9px] uppercase tracking-wider">
                                {selectedRun.parsedData.category}
                              </Badge>
                            ) : (
                              <em className="text-xs text-muted-foreground/50">Not matched</em>
                            )}
                          </div>
                        </div>

                        {selectedRun.type === "product" && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                              Product SKU
                            </span>
                            <div className="h-5 flex items-center">
                              <span className="text-sm font-mono font-medium text-foreground">
                                {selectedRun.parsedData?.sku || (
                                  <em className="text-muted-foreground/50 font-sans">Not extracted</em>
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Business Phone
                          </span>
                          <div className="h-5 flex items-center">
                            <span className="text-sm font-medium text-foreground">
                              {selectedRun.parsedData?.repPhone || (
                                <em className="text-muted-foreground/50">Not extracted</em>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Business Email
                          </span>
                          <div className="h-5 flex items-center">
                            <span className="text-sm font-medium text-foreground">
                              {selectedRun.parsedData?.repEmail || (
                                <em className="text-muted-foreground/50">Not extracted</em>
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Address & Specs */}
                    <Card className="bg-card/50">
                      <CardHeader className="border-b border-border/30 pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Globe className="size-4 text-primary" />
                          Specs & Address Context
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 mt-4">
                        {selectedRun.type === "vendor" ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Street Address
                              </span>
                              <div className="h-5 flex items-center">
                                <span className="text-sm text-foreground truncate">
                                  {selectedRun.parsedData?.street || (
                                    <em className="text-muted-foreground/50">Not extracted</em>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                City
                              </span>
                              <div className="h-5 flex items-center">
                                <span className="text-sm text-foreground">
                                  {selectedRun.parsedData?.city || (
                                    <em className="text-muted-foreground/50">Not extracted</em>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                State
                              </span>
                              <div className="h-5 flex items-center">
                                <span className="text-sm text-foreground">
                                  {selectedRun.parsedData?.state || (
                                    <em className="text-muted-foreground/50">Not extracted</em>
                                  )}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Finish / Color
                              </span>
                              <div className="h-5 flex items-center">
                                <span className="text-sm text-foreground truncate">
                                  {selectedRun.parsedData?.finishColor || (
                                    <em className="text-muted-foreground/50">Not extracted</em>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Dimensions
                              </span>
                              <div className="h-5 flex items-center">
                                <span className="text-sm text-foreground truncate">
                                  {selectedRun.parsedData?.dimensions || (
                                    <em className="text-muted-foreground/50">Not extracted</em>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Material Swatches
                              </span>
                              <div className="h-5 flex items-center">
                                <span className="text-sm text-foreground truncate">
                                  {selectedRun.parsedData?.materials || (
                                    <em className="text-muted-foreground/50">Not extracted</em>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Unit MSRP Price
                              </span>
                              <div className="h-5 flex items-center">
                                <span className="text-sm font-semibold text-primary">
                                  {selectedRun.parsedData?.msrp ? (
                                    formatCurrency(selectedRun.parsedData.msrp)
                                  ) : (
                                    <em className="text-muted-foreground/50 font-normal">Not extracted</em>
                                  )}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Description Block */}
                    <Card className="md:col-span-2 bg-card/50">
                      <CardContent className="flex flex-col gap-2 py-4">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          Extracted Company / Product Description
                        </span>
                        <p className="text-sm leading-relaxed text-foreground">
                          {selectedRun.parsedData?.description || (
                            <em className="text-muted-foreground/50">No description extracted</em>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Media Assets Inspector */}
                    <Card className="md:col-span-2 bg-card/50">
                      <CardHeader className="border-b border-border/30 pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Eye className="size-4 text-primary" />
                          Resolved Image Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-6 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Logo URL */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                              Resolved Branding Logo
                            </span>
                            {selectedRun.parsedData?.logoUrl ? (
                              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50">
                                <img
                                  src={selectedRun.parsedData.logoUrl}
                                  alt="Logo"
                                  className="size-12 rounded-md object-contain bg-white p-1 border border-border"
                                />
                                <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                  {selectedRun.parsedData.logoUrl}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center p-4 rounded-lg border border-dashed border-border text-xs text-muted-foreground italic select-none">
                                No branding logo resolved
                              </div>
                            )}
                          </div>

                          {/* Hero Image / Cover Image */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                              Resolved Cover / Hero Image
                            </span>
                            {selectedRun.parsedData?.heroImageUrl || selectedRun.parsedData?.coverImageUrl ? (
                              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50">
                                <img
                                  src={selectedRun.parsedData.heroImageUrl || selectedRun.parsedData.coverImageUrl}
                                  alt="Hero Showcase"
                                  className="size-12 rounded-md object-cover border border-border"
                                />
                                <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                  {selectedRun.parsedData.heroImageUrl || selectedRun.parsedData.coverImageUrl}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center p-4 rounded-lg border border-dashed border-border text-xs text-muted-foreground italic select-none">
                                No showcase image resolved
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Confidence Ratings prevention of layout shift */}
                    <Card className="md:col-span-2 bg-card/50">
                      <CardHeader className="border-b border-border/30 pb-3">
                        <CardTitle className="text-sm font-bold">AI Extraction Confidence Matrix</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                        {selectedRun.parsedData?.confidence &&
                          Object.entries(selectedRun.parsedData.confidence).map(([field, score]) => {
                            const val = typeof score === "number" ? score : 0;
                            const pct = Math.round(val * 100);
                            return (
                              <div
                                key={field}
                                className="flex flex-col p-2.5 rounded-lg border border-border/40 bg-background/40"
                              >
                                <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">
                                  {field}
                                </span>
                                <div className="h-5 flex items-center gap-1.5 mt-1">
                                  <span
                                    className={cn(
                                      "text-xs font-bold",
                                      val >= 0.75
                                        ? "text-emerald-500"
                                        : val >= 0.4
                                          ? "text-amber-500"
                                          : "text-rose-500",
                                    )}
                                  >
                                    {pct}%
                                  </span>
                                  <span className="text-[9px] text-muted-foreground font-semibold">certainty</span>
                                </div>
                              </div>
                            );
                          })}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB 2: Scraped Markdown text viewer */}
              {activeTab === "markdown" && selectedRun && (
                <Card className="border border-border/50 bg-card/50">
                  <CardHeader className="border-b pb-3.5 bg-muted/20">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText className="size-4 text-primary" />
                      Cleaned Webpage Readability Snapshot (Markdown)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Length: {selectedRun.scrapedMarkdown.length.toLocaleString()} characters. First 50,000 chars are
                      fed to the model context.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="text-[11px] leading-relaxed font-mono p-4 overflow-auto max-h-[580px] bg-background/30 text-muted-foreground whitespace-pre-wrap select-all selection:bg-primary/20">
                      {selectedRun.scrapedMarkdown || "No Jina Reader scraped markdown captured."}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* TAB 3: Prompt viewer */}
              {activeTab === "prompt" && selectedRun && (
                <Card className="border border-border/50 bg-card/50">
                  <CardHeader className="border-b pb-3.5 bg-muted/20">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Code className="size-4 text-primary" />
                      Raw LLM Prompt Instructions Context
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Contains the task instructions, category specifications, extracted HTML image crawler results, and
                      Jina body markdown.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="text-[11px] leading-relaxed font-mono p-4 overflow-auto max-h-[580px] bg-background/30 text-muted-foreground whitespace-pre-wrap select-all selection:bg-primary/20">
                      {selectedRun.prompt || "No prompt context captured."}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* TAB 4: Raw Response JSON viewer */}
              {activeTab === "raw" && selectedRun && (
                <Card className="border border-border/50 bg-card/50">
                  <CardHeader className="border-b pb-3.5 bg-muted/20">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Database className="size-4 text-primary" />
                      Raw AI Extraction String (Structured JSON)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Raw JSON response text returned from the model before frontend validation, self-healing parser
                      adjustments, and image candidate sorting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="text-[11px] leading-relaxed font-mono p-4 overflow-auto max-h-[580px] bg-background/30 text-muted-foreground whitespace-pre-wrap select-all selection:bg-primary/20">
                      {selectedRun.rawResponse || "No raw JSON response text captured."}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
