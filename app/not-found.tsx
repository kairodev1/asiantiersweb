import Link from "next/link";
import { Home, Search, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-x nav-offset grid min-h-[50vh] place-items-center text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 ring-1 ring-inset ring-brand-400/20">
          <Ghost className="h-6 w-6 text-brand-300" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold text-ink-100">404 — Page not found</h1>
        <p className="muted mx-auto mt-2 max-w-md">That page doesn’t exist, or the player you’re looking for isn’t on AsianTiers yet.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary h-10 px-4">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link href="/ranking" className="btn-ghost h-10 px-4">
            <Search className="h-4 w-4" /> Search rankings
          </Link>
        </div>
      </div>
    </div>
  );
}
