import { toast } from "sonner";

import { AI_ASSISTANT_NAME } from "@/lib/ai-assistant";

/** Shape every AI server action shares: a success flag and an optional transient-retry hint. */
interface RetryableResult {
  success: boolean;
  retryable?: boolean;
  error?: string;
}

/** Total attempts (initial call + retries) before giving up on a transient failure. */
const MAX_AI_ATTEMPTS = 3;

/**
 * Runs an AI server action with client-side retry on transient failures. The caller owns `toastId`
 * and can provide `onRetry` when a flow needs custom progress UI.
 */
export async function runAiActionWithRetry<T extends RetryableResult>(
  action: () => Promise<T>,
  opts: { toastId: string | number; busyMessage?: string; onRetry?: (attempt: number, maxAttempts: number) => void },
): Promise<T> {
  const busy = opts.busyMessage ?? `${AI_ASSISTANT_NAME} is busy due to high demand`;
  let result = await action();

  for (let attempt = 2; attempt <= MAX_AI_ATTEMPTS && !result.success && result.retryable; attempt++) {
    if (opts.onRetry) {
      opts.onRetry(attempt, MAX_AI_ATTEMPTS);
    } else {
      toast.loading(`${busy} - retrying (${attempt}/${MAX_AI_ATTEMPTS})...`, { id: opts.toastId });
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt - 1)));
    result = await action();
  }

  return result;
}
