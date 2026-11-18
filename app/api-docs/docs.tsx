import type { Metadata } from "next";
import { createElement as h, Fragment } from "react";
import { Terminal, ShieldCheck, Database, Gamepad2 } from "lucide-react";
import { GAMEMODES, TIERS, TIER_POINTS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "AsianTiers API documentation — used by the AsianTiers Discord bot to sync player tiers.",
  robots: { index: false, follow: false },
};

const ERRORS: [string, string][] = [
  ["400", "Request body is not valid JSON."],
  ["401", "Missing or invalid X-Bot-Secret header."],
  ["409", "IGN is linked to a different Discord account, or a Discord/IGN conflict was detected."],
  ["422", "discordId, ign, tier or gamemode failed validation."],
  ["500", "Database or server configuration error."],
];

const mono = "font-mono text-[12.5px] leading-relaxed";

function Block({ children, label }: { children?: string; label?: string }) {
  return h(
    "div",
    { className: "overflow-hidden rounded-xl border border-slate-200 bg-navy-950" },
    label
      ? h(
          "div",
          { className: "flex items-center justify-between border-b border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500" },
          h("span", null, label),
        )
      : null,
    h("pre", { className: `overflow-x-auto p-4 ${mono} text-ink-200` }, h("code", null, children)),
  );
}

function H3({ children }: { children: string }) {
  return h("h3", { className: "label mt-6" }, children);
}

export function ApiDocs() {
  const base = "https://asiantiers.vercel.app";

  const modes = h(
    "div",
    { className: "card p-5" },
    h("h2", { className: "flex items-center gap-2 text-sm font-bold text-ink-100" }, h(Gamepad2, { className: "h-4 w-4 text-mint-400" }), "Gamemodes"),
    h("p", { className: "mt-1 text-[11px] text-ink-500" }, "Accepted gamemode values (case-insensitive)."),
    h(
      "ul",
      { className: "mt-3 space-y-1.5" },
      GAMEMODES.map((g) =>
        h(
          "li",
          { key: g.id, className: "flex items-center justify-between rounded-lg bg-navy-800 px-2.5 py-1.5 text-xs" },
          h("span", { className: "font-mono text-ink-200" }, g.id),
          h("span", { className: "text-ink-400" }, g.name),
        ),
      ),
    ),
  );

  const points = h(
    "div",
    { className: "card p-5" },
    h("h2", { className: "flex items-center gap-2 text-sm font-bold text-ink-100" }, h(ShieldCheck, { className: "h-4 w-4 text-brand-300" }), "Tiers & points"),
    h(
      "div",
      { className: "mt-3 grid grid-cols-2 gap-1.5" },
      TIERS.map((t) =>
        h(
          "div",
          { key: t, className: "flex items-center justify-between rounded-md bg-navy-800 px-2 py-1" },
          h("span", { className: "font-mono text-[11px] font-bold text-brand-300" }, t),
          h("span", { className: "font-mono text-[11px] text-ink-300" }, `${TIER_POINTS[t]} pts`),
        ),
      ),
    ),
    h("p", { className: "mt-3 text-[11px] leading-relaxed text-ink-500" }, "Points are awarded per tier. A player's overall score is the sum across all gamemodes."),
  );

  const data = h(
    "div",
    { className: "card p-5" },
    h("h2", { className: "flex items-center gap-2 text-sm font-bold text-ink-100" }, h(Database, { className: "h-4 w-4 text-mint-400" }), "Public data"),
    h("p", { className: "mt-1 text-[11px] text-ink-500" }, "Read-only feed used by the live leaderboard."),
    h("code", { className: "mt-2 block rounded-lg bg-navy-950 px-2.5 py-2 font-mono text-[11px] text-ink-200" }, "GET /api/data"),
    h("p", { className: "mt-2 text-[11px] leading-relaxed text-ink-500" }, "Returns { players, hallOfFame }."),
  );

  const errors = h(
    "div",
    { className: "mt-4 overflow-hidden rounded-xl border border-slate-200" },
    h(
      "table",
      { className: "w-full text-left text-xs" },
      h(
        "tbody",
        null,
        ERRORS.map(([code, desc], i) =>
          h(
            "tr",
            { key: code, className: i ? "border-t border-slate-100" : "" },
            h("td", { className: "w-16 px-3 py-2 font-mono font-bold text-ink-100" }, code),
            h("td", { className: "px-3 py-2 text-ink-400" }, desc),
          ),
        ),
      ),
    ),
  );

  const main = h(
    "div",
    { className: "card p-5 lg:col-span-2" },
    h(
      "div",
      { className: "flex flex-wrap items-center gap-2" },
      h("span", { className: "rounded-md bg-mint-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-mint-300 ring-1 ring-inset ring-mint-400/30" }, "POST"),
      h("code", { className: "font-mono text-sm text-ink-100" }, "/api/tier-update"),
      h("span", { className: "ml-auto text-[11px] text-ink-500" }, "Authenticated with bot secret"),
    ),
    h(
      "p",
      { className: "mt-3 text-sm leading-relaxed text-ink-300" },
      "Updates a single gamemode tier for a player. Matching order: Discord ID → IGN → new profile. Only the relevant gamemode column is written.",
    ),
    h(H3, null, "Headers"),
    h(Block, { label: "HTTP" }, `Content-Type: application/json\nX-Bot-Secret: <BOT_SECRET>`),
    h(H3, null, "Request body"),
    h(Block, { label: "JSON" }, `{\n  "discordId": "123456789012345678",\n  "ign": "PlayerName",\n  "tier": "HT3",\n  "gamemode": "sword"\n}`),
    h(H3, null, "Success response · 200"),
    h(
      Block,
      { label: "JSON" },
      `{\n  "success": true,\n  "action": "updated",\n  "player": {\n    "id": 1,\n    "ign": "PlayerName",\n    "gamemode": "sword",\n    "sword": { "tier": "HT3", "points": 10 },\n    "overallPoints": 10\n  }\n}`,
    ),
    h(H3, null, "Error response"),
    h(Block, { label: "JSON" }, `{\n  "error": "tier must be one of ${TIERS.join(", ")}"\n}`),
    h(H3, null, "Status codes"),
    errors,
    h(H3, null, "cURL example"),
    h(
      Block,
      { label: "Shell" },
      `curl -X POST ${base}/api/tier-update \\\n  -H "Content-Type: application/json" \\\n  -H "X-Bot-Secret: $BOT_SECRET" \\\n  -d '{"discordId":"123456789012345678","ign":"PlayerName","tier":"HT3","gamemode":"sword"}'`,
    ),
  );

  return h(
    Fragment,
    null,
    h(
      "div",
      { className: "mx-auto w-full max-w-5xl px-4 sm:px-8" },
      h("span", { className: "eyebrow" }, h(Terminal, { className: "h-3 w-3" }), "Developer Reference"),
      h("h1", { className: "mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-100 sm:text-4xl" }, "Website API"),
      h(
        "p",
        { className: "muted mt-1.5 max-w-2xl" },
        "The AsianTiers Discord bot pushes verified test results to this API. Results are written to Supabase and appear on the leaderboard automatically.",
      ),
      h(
        "div",
        { className: "mt-8 grid gap-4 lg:grid-cols-3" },
        main,
        h("div", { className: "space-y-4" }, modes, points, data),
      ),
    ),
  );
}
