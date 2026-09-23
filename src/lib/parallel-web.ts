const EXTRACT_URL = "https://api.parallel.ai/v1/extract";
const SEARCH_URL = "https://api.parallel.ai/v1/search";
const BATCH = 20;
const EXTRACT_CAP = 100;
const EXTRACT_CONCURRENCY = 2;

export type ParallelPage = {
  url: string;
  title?: string;
  text: string;
};

type ExtractResult = {
  url?: string;
  title?: string;
  excerpts?: string[];
  full_content?: string;
};

type ExtractResponse = {
  results?: ExtractResult[];
  errors?: { url?: string; content?: string }[];
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function extractBatch(
  urls: string[],
  apiKey: string,
  objective: string,
  searchQueries?: string[],
): Promise<ParallelPage[]> {
  const res = await fetch(EXTRACT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      urls,
      objective,
      search_queries: searchQueries,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Parallel extract ${res.status}: ${body.slice(0, 240)}`);
  }

  const data = (await res.json()) as ExtractResponse;
  return (data.results || [])
    .map((row) => {
      const excerpts = (row.excerpts || []).join("\n\n");
      const text = excerpts || row.full_content || "";
      return {
        url: row.url || "",
        title: row.title,
        text,
      };
    })
    .filter((row) => row.url && row.text.trim());
}

export async function extractPages(
  urls: string[],
  objective: string,
  searchQueries?: string[],
): Promise<{ pages: ParallelPage[]; source: "parallel" | "unavailable"; error?: string }> {
  const apiKey = process.env.PARALLEL_API_KEY?.trim();
  if (!apiKey) {
    return { pages: [], source: "unavailable", error: "missing_parallel_api_key" };
  }

  try {
    const batches = chunk([...new Set(urls)].slice(0, EXTRACT_CAP), BATCH);
    const pages: ParallelPage[] = [];
    const errors: string[] = [];
    for (let i = 0; i < batches.length; i += EXTRACT_CONCURRENCY) {
      const slice = batches.slice(i, i + EXTRACT_CONCURRENCY);
      const nested = await Promise.allSettled(
        slice.map((batch) => extractBatch(batch, apiKey, objective, searchQueries)),
      );
      for (const result of nested) {
        if (result.status === "fulfilled") pages.push(...result.value);
        else {
          errors.push(
            result.reason instanceof Error ? result.reason.message : "extract failed",
          );
        }
      }
    }
    return { pages, source: "parallel", error: errors[0] };
  } catch (err) {
    return {
      pages: [],
      source: "parallel",
      error: err instanceof Error ? err.message : "Parallel extract failed",
    };
  }
}

type SearchResult = { url?: string; title?: string; excerpts?: string[] };

export async function searchPages(options: {
  objective: string;
  searchQueries: string[];
  maxResults?: number;
  includeDomains?: string[];
}): Promise<{ urls: string[]; pages: ParallelPage[]; error?: string }> {
  const apiKey = process.env.PARALLEL_API_KEY?.trim();
  if (!apiKey) return { urls: [], pages: [], error: "missing_parallel_api_key" };

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      objective: options.objective,
      search_queries: options.searchQueries,
      mode: "advanced",
      advanced_settings: {
        max_results: options.maxResults ?? 20,
        location: "in",
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    return { urls: [], pages: [], error: `Parallel search ${res.status}: ${body.slice(0, 240)}` };
  }

  const data = (await res.json()) as { results?: SearchResult[] };
  const pages = (data.results || [])
    .map((row) => ({
      url: row.url || "",
      title: row.title,
      text: (row.excerpts || []).join("\n\n"),
    }))
    .filter((row) => row.url);
  return { urls: pages.map((page) => page.url), pages };
}
