import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Crown, Sparkles, Search } from "lucide-react";
import { fetchHallOfFame, readClient } from "@/lib/supabase";
import { formatDate } from "@/lib/data";
import { Head, Empty } from "@/lib/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "The legends of the AsianTiers Minecraft PvP scene — AsianTiers Hall of Fame.",
};

const TINTS = ["bg-navy-800", "bg-navy-850", "bg-navy-700"];

export default async function HallOfFamePage() {
  let entries: Awaited<ReturnType<typeof fetchHallOfFame>> = [];
  let error: string | null = null;
  try {
    entries = await fetchHallOfFame(readClient());
  } catch (e) {
    error = e instanceof Error ? e.message : "Unable to load Hall of Fame";
  }

  const [featured, ...rest] = entries;

  return (
    <div className="container-x nav-offset">
      <div className="text-center">
        <span className="eyebrow mx-auto">
          <Trophy className="h-3 w-3 text-mint-300" /> Hall of Fame
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-ink-100 sm:text-5xl">
          Legends of the <span className="text-mint-400">AsianTiers PvP</span> scene
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">
          Honouring the players who defined an era. These entries are permanent — earned, never given.
        </p>
      </div>

      {error ? (
        <div className="mt-10">
          <Empty title="Could not load the Hall of Fame">{error}</Empty>
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-10">
          <Empty title="No inductees yet">
            The Hall of Fame is opening soon.{" "}
            <Link href="/ranking" className="text-brand-400 hover:text-brand-300">
              Browse the leaderboard
            </Link>{" "}
            in the meantime.
          </Empty>
        </div>
      ) : (
        <>
          {}
          <article className="card relative mt-10 grid overflow-hidden md:grid-cols-[1fr_1.1fr]">
            <div className="relative min-h-64 overflow-hidden">
              {featured.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.image} alt={featured.ign} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-navy-800">
                  <Head ign={featured.ign} size={120} className="ring-2 ring-slate-200" />
                </div>
              )}
              <div className="absolute inset-0 hidden md:block" />
              <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-navy-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-mint-300 backdrop-blur">
                <Crown className="h-3 w-3" /> Featured inductee
              </div>
            </div>
            <div className="relative p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mint-400/10 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-300/90">{featured.title || "Hall of Fame"}</p>
              <div className="mt-3 flex items-center gap-3">
                <Head ign={featured.ign} size={44} className="ring-1 ring-slate-200" />
                <h2 className="font-display text-2xl font-extrabold text-ink-100 sm:text-3xl">{featured.ign}</h2>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-200">
                {featured.description || "Inducted into the AsianTiers Hall of Fame for outstanding contributions to the community."}
              </p>
              <p className="mt-6 text-[11px] text-ink-400">Inducted {formatDate(featured.created_at)}</p>
            </div>
          </article>

          {rest.length > 0 && (
            <>
              <div className="mt-12 flex items-center gap-3">
                <h2 className="font-display text-lg font-bold text-ink-100">All inductees</h2>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((e, i) => (
                  <article key={String(e.id)} className="card card-hover group overflow-hidden">
                    <div className="relative h-44 overflow-hidden">
                      {e.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.image} alt={e.ign} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
                      ) : (
                        <div className={`grid h-full place-items-center ${TINTS[i % TINTS.length]}`}>
                          <Head ign={e.ign} size={84} className="ring-2 ring-slate-200" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-navy-900" />
                      <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-mint-300">
                        <Sparkles className="h-3 w-3" /> {e.title || "Inductee"}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-ink-100">{e.ign}</h3>
                        <Head ign={e.ign} size={24} />
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-300">
                        {e.description || "Inducted into the AsianTiers Hall of Fame."}
                      </p>
                      <p className="mt-3 border-t border-slate-100 pt-2.5 text-[10px] text-ink-500">Inducted {formatDate(e.created_at)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-12 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-navy-900/60 px-5 py-4 sm:flex-row">
        <p className="text-sm text-ink-300">Looking for the competitive ladder?</p>
        <Link href="/ranking" className="btn-primary h-9 px-4 text-[13px]">
          <Search className="h-3.5 w-3.5" /> View rankings
        </Link>
      </div>
    </div>
  );
}
