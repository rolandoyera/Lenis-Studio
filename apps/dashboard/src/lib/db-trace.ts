// Lightweight per-operation tracing for the Firestore service functions in lib/db.ts.
// Wrap a service function's async work in `trace(...)` to record the collection
// section, operation, timing, and success/failure. Output goes to the console
// (dev only) and to an in-memory ring buffer you can inspect from devtools via
// `window.__dbTrace()` (and clear with `window.__dbTraceClear()`).
//
// On top of the per-op log, operations are aggregated into a per-page scope so you
// can spot expensive pages ("why is this page doing 400 reads?"). Mount the
// <DbStatsProbe /> component once in the dashboard layout: each route change prints
// the previous page's summary and starts a fresh scope. Inspect the live page with
// `window.__dbStats()`.

export type DbOp = "READ" | "WRITE" | "DELETE";

export interface DbTraceEntry {
  at: number;
  section: string;
  op: DbOp;
  fn: string;
  detail?: string;
  /** Documents read on READ ops (getDoc → 1, getDocs → N). 0 for writes/deletes. */
  reads: number;
  /** True when a READ ran a collection query (getDocs) rather than a single getDoc. */
  query: boolean;
  ms: number;
  ok: boolean;
  error?: string;
}

const BUFFER_LIMIT = 200;
const buffer: DbTraceEntry[] = [];
const isDev = process.env.NODE_ENV !== "production";

function record(entry: DbTraceEntry): void {
  buffer.push(entry);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();
  accumulate(entry);

  if (!isDev) return;
  const status = entry.ok ? "✓" : "✗";
  const tail = entry.ok ? (entry.detail ? ` → ${entry.detail}` : "") : ` ${entry.error ?? ""}`;
  console.debug(`[db] ${entry.section} · ${entry.op} ${entry.fn}${tail} (${entry.ms}ms) ${status}`);
}

/**
 * Times and logs the wrapped Firestore work. Re-throws on failure so existing
 * error handling (e.g. callers that catch and return [] / null) is unchanged.
 * Pass `describe` to attach a short detail string built from the resolved value.
 *
 * Read counts are derived from the result: an array result is treated as a query
 * returning `length` documents; any other READ result counts as a single getDoc.
 */
export async function trace<T>(
  section: string,
  op: DbOp,
  fn: string,
  work: () => Promise<T>,
  describe?: (result: T) => string,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await work();
    const isArray = Array.isArray(result);
    record({
      at: Date.now(),
      section,
      op,
      fn,
      detail: describe?.(result),
      reads: op === "READ" ? (isArray ? (result as unknown[]).length : 1) : 0,
      query: op === "READ" && isArray,
      ms: Math.round(performance.now() - start),
      ok: true,
    });
    return result;
  } catch (error) {
    record({
      at: Date.now(),
      section,
      op,
      fn,
      reads: 0,
      query: false,
      ms: Math.round(performance.now() - start),
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// --- RAW OP BUFFER ---------------------------------------------------------

/** Snapshot of recent operations for ad-hoc inspection from devtools. */
export function getDbTrace(): DbTraceEntry[] {
  return [...buffer];
}

export function clearDbTrace(): void {
  buffer.length = 0;
}

// --- PER-PAGE AGGREGATION --------------------------------------------------

interface FnStat {
  calls: number;
  reads: number;
  writes: number;
}

interface PageStats {
  path: string;
  startedAt: number;
  reads: number;
  writes: number;
  queries: number;
  dbMs: number;
  byFn: Map<string, FnStat>;
}

let current: PageStats | null = null;

function accumulate(entry: DbTraceEntry): void {
  if (!current) return;
  current.dbMs += entry.ms;
  if (entry.op === "READ") {
    current.reads += entry.reads;
    if (entry.query) current.queries += 1;
  } else {
    current.writes += 1;
  }

  const stat = current.byFn.get(entry.fn) ?? { calls: 0, reads: 0, writes: 0 };
  stat.calls += 1;
  stat.reads += entry.reads;
  if (entry.op !== "READ") stat.writes += 1;
  current.byFn.set(entry.fn, stat);
}

function summarize(s: PageStats): void {
  if (!isDev) return;
  const totalCalls = [...s.byFn.values()].reduce((n, f) => n + f.calls, 0);
  if (totalCalls === 0) return; // no DB activity on this page — stay quiet

  console.groupCollapsed(
    `=== ${s.path} ===  reads:${s.reads}  writes:${s.writes}  queries:${s.queries}  db:${Math.round(s.dbMs)}ms`,
  );
  const rows = [...s.byFn.entries()].sort((a, b) => b[1].reads - a[1].reads || b[1].calls - a[1].calls);
  for (const [fn, f] of rows) {
    const metric = f.reads > 0 ? `${f.reads} reads` : `${f.writes} writes`;
    console.debug(`  ${fn.padEnd(24)} ${metric}  (${f.calls} call${f.calls === 1 ? "" : "s"})`);
  }
  console.groupEnd();
}

/** Flush the previous page's summary and begin a fresh scope. Called on route change. */
export function startPageScope(path: string): void {
  if (current) summarize(current);
  current = { path, startedAt: Date.now(), reads: 0, writes: 0, queries: 0, dbMs: 0, byFn: new Map() };
}

/** Plain snapshot of the live page scope for devtools inspection. */
export function dbStatsSnapshot() {
  if (!current) return null;
  return {
    path: current.path,
    reads: current.reads,
    writes: current.writes,
    queries: current.queries,
    dbMs: Math.round(current.dbMs),
    byFn: Object.fromEntries(current.byFn),
  };
}

// Expose on window for quick inspection in the browser console (dev only).
if (isDev && typeof window !== "undefined") {
  Object.assign(window as unknown as Record<string, unknown>, {
    __dbTrace: getDbTrace,
    __dbTraceClear: clearDbTrace,
    __dbStats: dbStatsSnapshot,
  });
}
