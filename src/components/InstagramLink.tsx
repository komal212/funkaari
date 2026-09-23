import {
  FUNKAARI_INSTAGRAM_HANDLE,
  FUNKAARI_INSTAGRAM_URL,
} from "@/lib/instagram";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

interface InstagramLinkProps {
  variant?: "icon" | "footer";
}

export function InstagramLink({ variant = "icon" }: InstagramLinkProps) {
  if (variant === "footer") {
    return (
      <a
        href={FUNKAARI_INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-ink shadow-sm ring-1 ring-lavender-100 transition hover:bg-white hover:text-[#E1306C]"
      >
        <InstagramGlyph className="h-4 w-4 fill-current" />
        @{FUNKAARI_INSTAGRAM_HANDLE}
      </a>
    );
  }

  return (
    <a
      href={FUNKAARI_INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow Funkaari on Instagram, @${FUNKAARI_INSTAGRAM_HANDLE}`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lavender-50 text-ink/80 transition hover:bg-[#E1306C] hover:text-white"
    >
      <InstagramGlyph className="h-5 w-5 fill-current" />
    </a>
  );
}
