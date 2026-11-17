import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { adminClient, fetchHallOfFame } from "@/lib/supabase";
import { LogoutButton } from "@/lib/ui";
import { HofManager } from "./hof-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  if (!(await isAuthenticated())) redirect("/admin/login?next=/admin/dashboard");

  let entries: Awaited<ReturnType<typeof fetchHallOfFame>> = [];
  let error: string | null = null;
  try {
    entries = await fetchHallOfFame(adminClient());
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load entries";
  }

  return (
    <div className="container-x nav-offset">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">
            <ShieldCheck className="h-3 w-3 text-mint-400" /> Admin
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink-100 sm:text-3xl">Dashboard</h1>
          <p className="muted mt-1">Manage Hall of Fame inductees. Changes are published instantly.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hall-of-fame" className="btn-ghost h-9 px-3 text-[13px]">
            View page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-6">
        <HofManager initialEntries={entries} initialError={error} />
      </div>
    </div>
  );
}
