import Link from "next/link";
import { ArrowRight, Users, ShieldCheck, Sparkles, ExternalLink, Swords } from "lucide-react";
import { fetchAllPlayers, fetchHallOfFame, readClient } from "@/lib/supabase";
import { GAMEMODES, DISCORD_INVITE } from "@/lib/tiers";
import { bestTier, formatNumber } from "@/lib/data";
import { Head, DiscordMark } from "@/lib/ui";

export const dynamic = "force-dynamic";

async function getSiteStats() {
  try {
    const { data } = await readClient().from("site_stats").select("id, player_count, test_count, member_count").order("id", { ascending: true }).limit(1);
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  let players: Awaited<ReturnType<typeof fetchAllPlayers>> = [];
  let hof: Awaited<ReturnType<typeof fetchHallOfFame>> = [];
  let stats: { player_count?: number; test_count?: number; member_count?: number } | null = null;
  let error: string | null = null;

  try {
    const db = readClient();
    [players, hof, stats] = await Promise.all([fetchAllPlayers(db), fetchHallOfFame(db), getSiteStats()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unable to load live data";
  }

  const rankedCount = players.filter((p) => bestTier(p)).length;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 nav-offset sm:px-8 animate-page-in">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-navy-900/60 px-6 py-16 sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-mint-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="eyebrow">
            <Sparkles className="h-3 w-3" />
            Official AsianTiers PvP Tierlist
          </span>
          <h1 className="mt-6 font-display text-6xl font-extrabold leading-[0.95] tracking-tight text-ink-100 sm:text-7xl md:text-8xl">
            Asian<span className="text-mint-400">Tiers</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
            The premier Minecraft PvP tierlist for Asian players. Verified rankings across thirteen competitive gamemodes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/ranking" className="btn-primary h-12 px-6 text-base">
              View rankings
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn-mint h-12 px-6 text-base">
              <DiscordMark className="h-4 w-4" />
              Join the Discord
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-mint-400" /> Verified tester results
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5 text-brand-300" /> Synced live from Discord
            </span>
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Ranked players" value={formatNumber(rankedCount)} />
        <StatCard label="Gamemodes" value={GAMEMODES.length} />
        <StatCard
          label="Tests completed"
          value={stats?.test_count ? formatNumber(stats.test_count) : "—"}
        />
      </section>

      {error && (
        <p className="mt-4 rounded-xl border border-brand-400/30 bg-navy-800 px-4 py-3 text-xs text-brand-300">
          Live data could not be loaded: {error}. Check the Supabase environment variables.
        </p>
      )}

      {hof.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-ink-100">Hall of Fame</h2>
            <Link href="/hall-of-fame" className="btn-ghost h-9 px-3 text-[13px]">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hof.slice(0, 3).map((e) => (
              <div key={String(e.id)} className="card p-4">
                <div className="flex items-center gap-3">
                  <Head ign={e.ign} size={40} className="ring-1 ring-slate-200" />
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-ink-100">{e.ign}</p>
                    <p className="truncate text-[11px] text-mint-300">{e.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="rounded-3xl border border-slate-200 bg-navy-900 px-6 py-10 sm:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                <Users className="h-4 w-4" /> AsianTiers Community
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink-100 sm:text-3xl">Get tested. Get ranked.</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-300">Join the Discord to queue for tests, register your IGN and follow every tier update in real time.</p>
            </div>
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn-mint h-11 shrink-0 px-5">
              <DiscordMark className="h-4 w-4" />
              Join Discord
            </a>
          </div>
        </div>
      </section>

      <p className="mt-10 flex items-center justify-center gap-2 text-[11px] text-ink-500">
        <Swords className="h-3.5 w-3.5" /> Tiers are earned through verified tests in the AsianTiers Discord.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-ink-100">{value}</p>
    </div>
  );
}