"use server";

import { GoogleAuth } from "google-auth-library";

export type UsageRange = "60m" | "24h" | "7d" | "30d";

export type OperationsPoint = {
  t: number;
  reads: number;
  writes: number;
  deletes: number;
};

export type SubscriptionsPoint = {
  t: number;
  listeners: number;
  connections: number;
};

export type RulesPoint = {
  t: number;
  allows: number;
  errors: number;
  denies: number;
};

export interface FirestoreUsage {
  range: UsageRange;
  /** Seconds each chart bucket spans (per-minute for 60m, wider for long ranges). */
  bucketSeconds: number;
  operations: OperationsPoint[];
  subscriptions: SubscriptionsPoint[];
  rules: RulesPoint[];
}

// Bucket widths keep every range at ~60 chart points, mirroring the console.
const RANGE_SPECS: Record<
  UsageRange,
  { durationMs: number; alignmentSeconds: number }
> = {
  "60m": { durationMs: 60 * 60_000, alignmentSeconds: 60 },
  "24h": { durationMs: 24 * 3_600_000, alignmentSeconds: 1_800 },
  "7d": { durationMs: 7 * 86_400_000, alignmentSeconds: 10_800 },
  "30d": { durationMs: 30 * 86_400_000, alignmentSeconds: 43_200 },
};

// Firestore metrics land in Cloud Monitoring ~4 minutes late (ingestDelay:
// 240s on the metric descriptors); ending the window earlier avoids a
// misleading dip to zero at the right edge of every chart.
const INGEST_DELAY_MS = 240_000;

const MONITORING_BASE = "https://monitoring.googleapis.com/v3";

const COUNT_METRICS = {
  "firestore.googleapis.com/document/read_count": "reads",
  "firestore.googleapis.com/document/write_count": "writes",
  "firestore.googleapis.com/document/delete_count": "deletes",
} as const;

const RULES_METRIC = "firestore.googleapis.com/rules/evaluation_count";

const RULES_RESULTS = {
  ALLOW: "allows",
  DENY: "denies",
  ERROR: "errors",
} as const;

const GAUGE_METRICS = {
  "firestore.googleapis.com/network/snapshot_listeners": "listeners",
  "firestore.googleapis.com/network/active_connections": "connections",
} as const;

interface TimeSeries {
  metric: { type: string; labels?: Record<string, string> };
  points?: {
    interval: { endTime: string };
    value: { int64Value?: string; doubleValue?: number };
  }[];
}

function parseServiceAccountKey(raw: string): Record<string, string> {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, string>;
}

let monitoringAuth: { auth: GoogleAuth; projectId: string } | null = null;

function getMonitoringAuth() {
  if (monitoringAuth) return monitoringAuth;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_KEY in environment variables.",
    );
  }

  const serviceAccount = parseServiceAccountKey(serviceAccountKey);
  monitoringAuth = {
    auth: new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/monitoring.read"],
    }),
    projectId: serviceAccount.project_id,
  };
  return monitoringAuth;
}

async function listTimeSeries(params: {
  filter: string;
  startMs: number;
  endMs: number;
  alignmentSeconds: number;
  perSeriesAligner: "ALIGN_SUM" | "ALIGN_MAX";
  crossSeriesReducer: "REDUCE_SUM" | "REDUCE_MAX";
  groupByFields: string[];
}): Promise<TimeSeries[]> {
  const { auth, projectId } = getMonitoringAuth();

  const search = new URLSearchParams({
    filter: params.filter,
    "interval.startTime": new Date(params.startMs).toISOString(),
    "interval.endTime": new Date(params.endMs).toISOString(),
    "aggregation.alignmentPeriod": `${params.alignmentSeconds}s`,
    "aggregation.perSeriesAligner": params.perSeriesAligner,
    "aggregation.crossSeriesReducer": params.crossSeriesReducer,
  });
  for (const field of params.groupByFields) {
    search.append("aggregation.groupByFields", field);
  }

  const client = await auth.getClient();
  const response = await client.request<{ timeSeries?: TimeSeries[] }>({
    url: `${MONITORING_BASE}/projects/${projectId}/timeSeries?${search}`,
  });
  return response.data.timeSeries ?? [];
}

function pointValue(point: NonNullable<TimeSeries["points"]>[number]): number {
  const { int64Value, doubleValue } = point.value;
  return int64Value !== undefined ? Number(int64Value) : (doubleValue ?? 0);
}

/** Map of series key -> (bucket end ms -> value). */
function indexSeries(
  series: TimeSeries[],
  keyOf: (s: TimeSeries) => string | null,
): Map<string, Map<number, number>> {
  const byKey = new Map<string, Map<number, number>>();
  for (const s of series) {
    const key = keyOf(s);
    if (!key) continue;
    const buckets = byKey.get(key) ?? new Map<number, number>();
    for (const point of s.points ?? []) {
      buckets.set(Date.parse(point.interval.endTime), pointValue(point));
    }
    byKey.set(key, buckets);
  }
  return byKey;
}

async function fetchUsage(range: UsageRange): Promise<FirestoreUsage> {
  const { durationMs, alignmentSeconds } = RANGE_SPECS[range];
  // Snap to a whole minute so bucket timestamps are clean and every fetch
  // within the same minute asks for an identical window.
  const endMs = Math.floor((Date.now() - INGEST_DELAY_MS) / 60_000) * 60_000;
  const startMs = endMs - durationMs;

  // timeSeries.list accepts only ONE metric type per request (one_of filters
  // are rejected), so each metric is its own call: 6 per refresh, shared by
  // all viewers via the cache below.
  const window = { startMs, endMs, alignmentSeconds };
  const countCalls = Object.entries(COUNT_METRICS).map(
    async ([type, key]) => ({
      key,
      series: await listTimeSeries({
        ...window,
        filter: `metric.type = "${type}"`,
        // REDUCE_SUM collapses label splits (e.g. read type LOOKUP vs QUERY).
        perSeriesAligner: "ALIGN_SUM" as const,
        crossSeriesReducer: "REDUCE_SUM" as const,
        groupByFields: [],
      }),
    }),
  );
  const rulesCall = listTimeSeries({
    ...window,
    filter: `metric.type = "${RULES_METRIC}"`,
    perSeriesAligner: "ALIGN_SUM",
    crossSeriesReducer: "REDUCE_SUM",
    groupByFields: ["metric.labels.result"],
  });
  const gaugeCalls = Object.entries(GAUGE_METRICS).map(
    async ([type, key]) => ({
      key,
      series: await listTimeSeries({
        ...window,
        filter: `metric.type = "${type}"`,
        perSeriesAligner: "ALIGN_MAX" as const,
        crossSeriesReducer: "REDUCE_MAX" as const,
        groupByFields: [],
      }),
    }),
  );

  const [countResults, rulesSeries, gaugeResults] = await Promise.all([
    Promise.all(countCalls),
    rulesCall,
    Promise.all(gaugeCalls),
  ]);

  const counts = new Map<string, Map<number, number>>();
  for (const { key, series } of countResults) {
    counts.set(key, indexSeries(series, () => key).get(key) ?? new Map());
  }
  for (const [key, buckets] of indexSeries(rulesSeries, (s) => {
    const result = s.metric.labels?.result as
      | keyof typeof RULES_RESULTS
      | undefined;
    return result ? RULES_RESULTS[result] : null;
  })) {
    counts.set(key, buckets);
  }
  const gauges = new Map<string, Map<number, number>>();
  for (const { key, series } of gaugeResults) {
    gauges.set(key, indexSeries(series, () => key).get(key) ?? new Map());
  }

  // Aligned bucket end times are anchored to interval.endTime, so regenerating
  // them from endMs matches the API's timestamps exactly. Zero-fill misses so
  // idle periods draw as a flat line instead of a gap.
  const alignmentMs = alignmentSeconds * 1_000;
  const bucketCount = Math.floor(durationMs / alignmentMs);
  const at = (buckets: Map<number, number> | undefined, t: number) =>
    buckets?.get(t) ?? 0;

  const operations: OperationsPoint[] = [];
  const subscriptions: SubscriptionsPoint[] = [];
  const rules: RulesPoint[] = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    const t = endMs - i * alignmentMs;
    operations.push({
      t,
      reads: at(counts.get("reads"), t),
      writes: at(counts.get("writes"), t),
      deletes: at(counts.get("deletes"), t),
    });
    subscriptions.push({
      t,
      listeners: at(gauges.get("listeners"), t),
      connections: at(gauges.get("connections"), t),
    });
    rules.push({
      t,
      allows: at(counts.get("allows"), t),
      denies: at(counts.get("denies"), t),
      errors: at(counts.get("errors"), t),
    });
  }

  return {
    range,
    bucketSeconds: alignmentSeconds,
    operations,
    subscriptions,
    rules,
  };
}

// One upstream fetch per range per minute, shared by every viewer. Caching the
// promise also dedupes concurrent requests; failures evict so the next call retries.
const CACHE_TTL_MS = 60_000;
const usageCache = new Map<
  UsageRange,
  { at: number; promise: Promise<FirestoreUsage> }
>();

export async function getFirestoreUsage(
  range: UsageRange,
): Promise<FirestoreUsage> {
  const cached = usageCache.get(range);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = fetchUsage(range);
  usageCache.set(range, { at: Date.now(), promise });
  promise.catch(() => {
    if (usageCache.get(range)?.promise === promise) {
      usageCache.delete(range);
    }
  });
  return promise;
}
