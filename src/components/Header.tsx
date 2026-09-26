import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CitySwitcher } from "@/components/CitySwitcher";
import { InstagramLink } from "@/components/InstagramLink";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-lavender-100/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group min-w-0">
          <Logo />
        </Link>

        <div className="flex items-center gap-3">
          <CitySwitcher />
          <InstagramLink />
        </div>
      </div>
    </header>
  );
}
