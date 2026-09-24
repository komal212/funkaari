"use client";

import { useEffect } from "react";

/**
 * Official Vercel Web Analytics injector (same as @vercel/analytics/next).
 * Loads only in the browser; Vercel serves /_vercel/insights/* after Analytics
 * is enabled and a production deploy completes.
 */
export function WebAnalytics() {
  useEffect(() => {
    const w = window as Window & {
      va?: (...args: unknown[]) => void;
      vaq?: unknown[];
    };
    if (!w.va) {
      w.va = (...params: unknown[]) => {
        w.vaq = w.vaq || [];
        w.vaq.push(params);
      };
    }

    const src = "/_vercel/insights/script.js";
    if (document.querySelector(`script[src="${src}"]`)) return;

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.sdkn = "@vercel/analytics/next";
    script.dataset.sdkv = "2.0.1";
    script.onerror = () => {
      console.log(
        "[Vercel Web Analytics] Failed to load script. Enable Web Analytics in the Vercel project and redeploy.",
      );
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
