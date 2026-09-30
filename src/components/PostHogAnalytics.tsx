"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { bootPostHog } from "@/lib/posthog-browser";

function PostHogPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    if (!token) return;
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
    bootPostHog(token, host);
  }, []);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    if (!token) return;
    const posthog = (window as Window & { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog;
    if (!posthog?.capture) return;
    const url = `${window.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogAnalytics() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViews />
    </Suspense>
  );
}
