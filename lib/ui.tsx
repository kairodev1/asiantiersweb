/* Shared client-side UI primitives + nav. Small and dependency-light on purpose. */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X, Search, Loader2, Home, Trophy, Medal, User } from "lucide-react";
import { tierStyle, cleanTier, GAMEMODES, gamemodeIcon } from "./tiers";
import { formatNumber } from "./data";

/* ---------- Brand ---------- */

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5">
      {/* Main AsianTiers logo — voxel Earth cube */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        width={40}
        height={40}
        alt="AsianTiers logo"
        draggable={false}
        className={`${s} shrink-0 rounded-lg object-contain transition duration-200 group-hover:scale-105`}
      />
      <span className="font-display text-[17px] font-extrabold tracking-tight text-ink-100">
        Asian<span className="text-mint-500">Tiers</span>
      </span>
    </Link>
  );
}

/* ---------- Gamemode icon (local SVG assets) ---------- */

export function ModeIcon({ id, size = 24, className = "" }: { id: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={gamemodeIcon(id)}
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* ---------- Global player search (navbar) ---------- */

type MiniPlayer = { ign: string; points: number; tier: string | null };

// Normalise whatever /api/data returns so a missing field can never crash the navbar.
function toMiniPlayers(rows: unknown): MiniPlayer[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((p) => p && typeof p.ign === "string")
    .map((p) => ({
      ign: p.ign as string,
      points: Number(p.overall_points) || 0,
      tier: typeof p.overall_tier === "string" && p.overall_tier ? p.overall_tier : null,
    }));
}

function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<MiniPlayer[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const ensurePlayers = async () => {
    if (players || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setPlayers(toMiniPlayers(json.players));
    } catch {
      /* leave empty — search still submits to /ranking */
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !players) return [];
    return players
      .filter((p) => p.ign.toLowerCase().includes(q))
      .sort((a, b) => b.points - a.points)
      .slice(0, 6);
  }, [query, players]);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    // Close the dropdown first, then navigate on the next tick so the click is not
    // swallowed by the re-render that removes the suggestion list.
    setTimeout(() => {
      if (path.startsWith("/player/")) router.push(path);
      else window.location.assign(path);
    }, 0);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (results[active] && open) return go(`/player/${encodeURIComponent(results[active].ign)}`);
    if (q) go(`/ranking?q=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={boxRef} className={`relative ${compact ? "w-full" : "w-full max-w-md"}`}>
      <form onSubmit={submit} role="search">
        <div className="group relative">
          <Search
            aria-hidden
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 transition duration-200 group-focus-within:text-mint-400 ${
              compact ? "h-4.5 w-4.5" : "h-[18px] w-[18px]"
            }`}
          />
          <input
            type="search"
            name="player-search"
            autoComplete="off"
            value={query}
            onFocus={() => {
              setOpen(true);
              ensurePlayers();
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              ensurePlayers();
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search players"
            aria-label="Search players by IGN"
            className={`w-full rounded-xl border border-slate-200 bg-navy-950 text-ink-100 placeholder:text-ink-400 outline-none transition duration-200 hover:border-slate-300 focus:border-mint-400/70 focus:ring-2 focus:ring-mint-400/20 [&::-webkit-search-cancel-button]:hidden ${
              compact ? "h-11 pl-11 pr-9 text-sm" : "h-11 pl-11 pr-9 text-sm"
            }`}
          />
          {busy ? (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-500" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-500 transition hover:text-ink-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 animate-slide-down overflow-hidden rounded-xl border border-slate-200 bg-navy-900 shadow-rise">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((p, i) => (
                <li key={p.ign}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(`/player/${encodeURIComponent(p.ign)}`)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition ${i === active ? "bg-navy-800" : ""}`}
                  >
                    <User className={`h-3.5 w-3.5 ${i === active ? "text-mint-400" : "text-ink-500"}`} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-100">{p.ign}</span>
                    <TierBadge tier={p.tier} size="sm" />
                    <span className="font-mono text-[11px] text-ink-400">{formatNumber(p.points)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-xs text-ink-400">
              {busy ? "Loading players…" : "No matching player. Press Enter to search rankings."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Nav bar ---------- */

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/ranking", label: "Rankings", icon: Trophy },
  { href: "/hall-of-fame", label: "Hall of Fame", icon: Medal },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "border-slate-200 shadow-sm" : "border-slate-100"
      }`}
    >
      <div className="container-x flex h-16 items-center gap-4">
        <Logo />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  active ? "bg-mint-500/10 text-mint-600" : "text-ink-400 hover:bg-slate-100 hover:text-ink-100"
                }`}
              >
                <l.icon className={`h-4 w-4 transition ${active ? "text-mint-500" : "text-ink-400"}`} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden w-full max-w-sm sm:block">
          <GlobalSearch />
        </div>

        <button
          className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-ink-300 transition hover:border-mint-500/40 hover:text-ink-100 sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="container-x animate-slide-down pb-3 sm:hidden">
          <GlobalSearch compact />
        </div>
      )}

      {open && (
        <div className="animate-slide-down border-t border-slate-200 bg-navy-900 md:hidden">
          <div className="container-x flex flex-col gap-1 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition ${
                  isActive(l.href) ? "bg-navy-800 text-ink-100" : "text-ink-200 hover:bg-navy-800"
                }`}
              >
                <l.icon className={`h-[18px] w-[18px] ${isActive(l.href) ? "text-mint-400" : "text-ink-400"}`} />
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- Gamemode bar ---------- */

export function GamemodeBar({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const tabs = [{ id: "overall", name: "Overall" }, ...GAMEMODES.map((g) => ({ id: g.id, name: g.name }))];
  return (
    <div
      className="flex flex-wrap justify-center gap-1 rounded-xl border border-slate-200 bg-navy-900 p-1.5"
      role="tablist"
      aria-label="Gamemodes"
    >
      {tabs.map((m) => {
        const selected = value === m.id;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(m.id)}
            className={`flex w-[calc((100%-0.75rem)/4)] min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 transition duration-200 sm:w-[calc((100%-1rem)/5)] md:w-[calc((100%-1.75rem)/8)] ${
              selected ? "bg-navy-700 text-ink-100 ring-1 ring-inset ring-slate-200" : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
            }`}
          >
            <ModeIcon
              id={m.id}
              size={18}
              className={`transition duration-200 ${selected ? "opacity-100" : "opacity-70"}`}
            />
            <span className="w-full truncate text-center text-[11px] font-semibold leading-none tracking-tight">{m.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Tier badge ---------- */

export function TierBadge({ tier, peak, size = "md" }: { tier?: string | null; peak?: string | null; size?: "xs" | "sm" | "md" | "lg" }) {
  const s = tierStyle(tier);
  const sizes = {
    xs: "h-5 min-w-[2.5rem] gap-1 px-1.5 text-[10px]",
    sm: "h-6 min-w-[3rem] px-2 text-[11px]",
    md: "h-8 min-w-[3.75rem] px-2.5 text-xs",
    lg: "h-11 min-w-[5rem] px-3 text-base",
  }[size];
  const displayPeak = peak ?? tier;
  const label = `Peak: ${displayPeak ?? "-"}`;
  return (
    <span className="group/badge relative inline-flex">
      <span
        title={label}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md font-mono font-bold tabular-nums ring-1 ring-inset ${s.bg} ${s.text} ${s.ring} ${sizes}`}
      >
        <span className={`${size === "xs" ? "h-1 w-1" : "h-1.5 w-1.5"} rounded-full ${s.dot}`} />
        {cleanTier(tier) ?? "No Tier"}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-navy-900 px-2 py-1 text-[10px] font-semibold text-ink-100 shadow-lg ring-1 ring-slate-200 group-hover/badge:block">
        {label}
      </span>
    </span>
  );
}

/* ---------- Minecraft head / skin ---------- */

/**
 * Image sources, tried in order. Each one falls through to the next on error and
 * finally to the real Steve skin, so a broken image is never shown.
 */
function skinSources(ign: string, size: number, shape: "head" | "body"): string[] {
  const px = Math.max(size * 2, 96);
  const name = encodeURIComponent(ign.trim());
  const face = [
    `https://mc-heads.net/avatar/${name}/${px}`,
    `https://minotar.net/helm/${name}/${px}.png`,
  ];
  return shape === "body"
    ? [`https://mc-heads.net/body/${name}/${px}`, `https://mc-heads.net/avatar/${name}/${px}`, ...face.slice(1)]
    : face;
}

const STEVE = "https://mc-heads.net/avatar/MHF_Steve/128";

export function Head({
  ign,
  size = 40,
  className = "",
  shape = "head",
  ringClassName = "",
}: {
  ign: string;
  size?: number;
  className?: string;
  /** "square" renders a perfect, unrounded square face. */
  shape?: "head" | "body" | "square";
  /** Ring/outline classes — applied with box-sizing so the square stays exact. */
  ringClassName?: string;
}) {
  const valid = typeof ign === "string" && /^[A-Za-z0-9_]{1,16}$/.test(ign.trim());
  const sources = valid ? skinSources(ign, size, shape === "body" ? "body" : "head") : [];
  const all = [...sources, STEVE];
  const [index, setIndex] = useState(0);

  const square = shape === "square";
  const radius = square ? "rounded-none" : "rounded-md";
  const style: React.CSSProperties = { width: size, height: size, minWidth: size, minHeight: size, maxWidth: size, maxHeight: size, boxSizing: "border-box" };

  if (index >= all.length) {
    // Every remote source failed — show initials rather than a broken image.
    return (
      <span className={`grid place-items-center ${radius} bg-navy-700 font-display font-bold text-mint-300 ${ringClassName} ${className}`} style={{ ...style, fontSize: size * 0.42 }} aria-hidden>
        {(ign || "?").slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={all[index]}
      src={all[index]}
      onError={() => setIndex((i) => i + 1)}
      width={size}
      height={size}
      alt={valid ? `${ign}'s Minecraft skin` : "Minecraft Steve skin"}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`${square ? "shrink-0" : "shrink-0"} ${radius} bg-navy-800 ${
        shape === "body" ? "object-contain" : "object-cover"
      } ${square ? "[object-position:center_top]" : "[image-rendering:pixelated]"} ${ringClassName} ${className}`}
      style={style}
    />
  );
}

export function DiscordMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.25a18.3 18.3 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.07.07 0 0 0-.04.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.29 1.22-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.1.25-.2.37-.3a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.3a.08.08 0 0 1-.01.13 12.3 12.3 0 0 1-1.87.89.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}

/* ---------- Misc ---------- */

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card px-5 py-4 transition duration-200 hover:border-mint-400/30">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-ink-100">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      <p className="font-semibold text-ink-100">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-400">{children}</p>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
      <Loader2 className="h-4 w-4 animate-spin text-mint-400" /> {label}…
    </div>
  );
}

/* Logout button used by the admin dashboard */
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-ghost h-9 px-3 text-[13px]"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Sign out
    </button>
  );
}
