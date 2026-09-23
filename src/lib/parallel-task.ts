const TASKS_URL = "https://api.parallel.ai/v1/tasks/runs";

type TaskCreate = { run_id?: string; status?: string; error?: { message?: string } };

type TaskResult<T> = {
  run?: { run_id?: string; status?: string };
  output?: { content?: T; type?: string };
  error?: { message?: string };
};

type PendingRun = { runId: string; createdAt: number; input: string };

let pending: PendingRun | null = null;
const PENDING_TTL_MS = 45 * 60 * 1000;

function stillPending(input: string): PendingRun | null {
  if (!pending) return null;
  if (pending.input !== input) return null;
  if (Date.now() - pending.createdAt > PENDING_TTL_MS) {
    pending = null;
    return null;
  }
  return pending;
}

async function fetchResult(
  runId: string,
  apiKey: string,
  timeoutSec: number,
): Promise<Response> {
  return fetch(`${TASKS_URL}/${runId}/result?timeout=${timeoutSec}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });
}

export async function runTaskJson<T>(options: {
  input: string;
  jsonSchema: Record<string, unknown>;
  processor?: string;
  timeoutSec?: number;
}): Promise<{
  content: T | null;
  runId?: string;
  pending?: boolean;
  error?: string;
}> {
  const apiKey = process.env.PARALLEL_API_KEY?.trim();
  if (!apiKey) return { content: null, error: "missing_parallel_api_key" };

  const timeoutSec = options.timeoutSec ?? 20;
  const existing = stillPending(options.input);
  if (existing) {
    const result = await fetchResult(existing.runId, apiKey, timeoutSec);
    if (result.status === 408) {
      return { content: null, runId: existing.runId, pending: true };
    }
    if (!result.ok) {
      const body = await result.text();
      pending = null;
      return {
        content: null,
        runId: existing.runId,
        error: `Parallel task result ${result.status}: ${body.slice(0, 240)}`,
      };
    }
    const data = (await result.json()) as TaskResult<T>;
    pending = null;
    return {
      content: data.output?.content ?? null,
      runId: existing.runId,
      error: data.error?.message,
    };
  }

  const created = await fetch(TASKS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      input: options.input,
      processor: options.processor || "base",
      task_spec: {
        output_schema: {
          type: "json",
          json_schema: options.jsonSchema,
        },
      },
    }),
    cache: "no-store",
  });

  if (!created.ok) {
    const body = await created.text();
    return { content: null, error: `Parallel task ${created.status}: ${body.slice(0, 240)}` };
  }

  const run = (await created.json()) as TaskCreate;
  const runId = run.run_id;
  if (!runId) return { content: null, error: "Parallel task missing run_id" };

  pending = { runId, createdAt: Date.now(), input: options.input };

  const result = await fetchResult(runId, apiKey, timeoutSec);
  if (result.status === 408) {
    return { content: null, runId, pending: true };
  }

  if (!result.ok) {
    const body = await result.text();
    pending = null;
    return {
      content: null,
      runId,
      error: `Parallel task result ${result.status}: ${body.slice(0, 240)}`,
    };
  }

  const data = (await result.json()) as TaskResult<T>;
  pending = null;
  return {
    content: data.output?.content ?? null,
    runId,
    error: data.error?.message,
  };
}
