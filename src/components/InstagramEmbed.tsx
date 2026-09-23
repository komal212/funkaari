"use client";

import { useEffect, useRef } from "react";
import { isInstagramPostUrl } from "@/lib/instagram";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export function InstagramEmbed({ url }: { url?: string }) {
  const ref = useRef<HTMLQuoteElement>(null);
  const canEmbed = Boolean(url && isInstagramPostUrl(url));

  useEffect(() => {
    if (!canEmbed || !url) return;

    const run = () => window.instgrm?.Embeds.process();

    if (window.instgrm) {
      run();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://www.instagram.com/embed.js"]'
    );
    if (existing) {
      existing.addEventListener("load", run);
      return () => existing.removeEventListener("load", run);
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = run;
    document.body.appendChild(script);
  }, [canEmbed, url]);

  if (!canEmbed || !url) return null;

  return (
    <blockquote
      ref={ref}
      className="instagram-media !m-0 !min-w-0 w-full"
      data-instgrm-permalink={url.split("?")[0]}
      data-instgrm-version="14"
      data-instgrm-captioned
    />
  );
}
