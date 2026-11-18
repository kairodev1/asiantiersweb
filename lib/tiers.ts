
export type GamemodeId =
  | "sword"
  | "mace"
  | "axe"
  | "diapot"
  | "nethpot"
  | "smp"
  | "crystal"
  | "uhc"
  | "spearmace"
  | "diasmp"
  | "manhunt"
  | "shieldlessuhc"
  | "cart";

export type Gamemode = {
  id: GamemodeId;
  name: string;
  
  tierColumn: string;
  
  peakColumn: string;
  
  pointsColumn: string;
  
  aliases: string[];
  
  emoji?: string;
  
  waitlistRoleId?: string;
};

export const GAMEMODES: Gamemode[] = [
  { id: "sword", name: "Sword", tierColumn: "sword_tier", peakColumn: "sword_peak_tier", pointsColumn: "sword_points", aliases: ["sword", "swordpvp", "1.8"] },
  { id: "mace", name: "Mace", tierColumn: "mace_tier", peakColumn: "mace_peak_tier", pointsColumn: "mace_points", aliases: ["mace", "macepvp"] },
  { id: "axe", name: "Axe", tierColumn: "axe_tier", peakColumn: "axe_peak_tier", pointsColumn: "axe_points", aliases: ["axe", "axepvp"] },
  { id: "diapot", name: "DiaPot", tierColumn: "diapot_tier", peakColumn: "diapot_peak_tier", pointsColumn: "pot_points", aliases: ["diapot", "diamondpot", "pot"] },
  { id: "nethpot", name: "NethPot", tierColumn: "nethpot_tier", peakColumn: "nethpot_peak_tier", pointsColumn: "nethpot_points", aliases: ["nethpot", "nethop", "np"], emoji: "<:nethpot:1567479520632643655>", waitlistRoleId: "1567481413878415502" },
  { id: "smp", name: "SMP", tierColumn: "smp_tier", peakColumn: "smp_peak_tier", pointsColumn: "smp_points", aliases: ["smp", "smpkit"] },
  { id: "crystal", name: "Crystal", tierColumn: "crystal_tier", peakColumn: "crystal_peak_tier", pointsColumn: "vanilla_points", aliases: ["crystal", "crystals", "cpvp"], emoji: "<:Crystal:1567479595165425806>", waitlistRoleId: "1567481414952165412" },
  { id: "uhc", name: "UHC", tierColumn: "uhc_tier", peakColumn: "uhc_peak_tier", pointsColumn: "uhc_points", aliases: ["uhc", "hcf"] },
  { id: "spearmace", name: "SpearMace", tierColumn: "spearmace_tier", peakColumn: "spearmace_peak_tier", pointsColumn: "spearmace_points", aliases: ["spearmace", "spear", "spearmacepvp"] },
  { id: "diasmp", name: "Diamond SMP", tierColumn: "diasmp_tier", peakColumn: "diasmp_peak_tier", pointsColumn: "diasmp_points", aliases: ["diasmp", "diamondsmp", "dsmp"] },
  { id: "manhunt", name: "Manhunt", tierColumn: "manhunt_tier", peakColumn: "manhunt_peak_tier", pointsColumn: "manhunt_points", aliases: ["manhunt", "mh"] },
  { id: "shieldlessuhc", name: "ShieldLess UHC", tierColumn: "shieldlessuhc_tier", peakColumn: "shieldlessuhc_peak_tier", pointsColumn: "shieldlessuhc_points", aliases: ["shieldlessuhc", "shieldless", "sluhc"] },
  { id: "cart", name: "Cart", tierColumn: "cart_tier", peakColumn: "cart_peak_tier", pointsColumn: "cart_points", aliases: ["cart", "minecart"] },
];

export const GAMEMODE_BY_ID: Record<string, Gamemode> = Object.fromEntries(GAMEMODES.map((g) => [g.id, g]));
export const GAMEMODE_BY_NAME: Record<string, Gamemode> = Object.fromEntries(GAMEMODES.map((g) => [g.name.toLowerCase(), g]));

export function resolveGamemode(input: unknown): Gamemode | null {
  if (typeof input !== "string") return null;
  const key = input.trim().toLowerCase().replace(/[\s_-]/g, "");
  return GAMEMODES.find((g) => g.id === key || g.aliases.includes(key)) ?? null;
}


export const TIERS = [
  "HT1", "RHT1", "LT1", "RLT1",
  "HT2", "RHT2", "LT2", "RLT2",
  "HT3", "RHT3", "LT3", "RLT3",
  "HT4", "RHT4", "LT4", "RLT4",
  "HT5", "RHT5", "LT5", "RLT5",
] as const;
export type Tier = (typeof TIERS)[number];


export const TIER_POINTS: Record<Tier, number> = {
  HT1: 60,
  RHT1: 60,
  LT1: 45,
  RLT1: 45,
  HT2: 30,
  RHT2: 30,
  LT2: 20,
  RLT2: 20,
  HT3: 10,
  RHT3: 10,
  LT3: 6,
  RLT3: 6,
  HT4: 4,
  RHT4: 4,
  LT4: 3,
  RLT4: 3,
  HT5: 2,
  RHT5: 2,
  LT5: 1,
  RLT5: 1,
};

const TIER_SET = new Set<string>(TIERS);

export function normalizeTier(input: unknown): Tier | null {
  if (typeof input !== "string") return null;
  const t = input.trim().toUpperCase();
  return TIER_SET.has(t) ? (t as Tier) : null;
}

export function isTier(input: unknown): input is Tier {
  return typeof input === "string" && TIER_SET.has(input.toUpperCase());
}

export function isRetiredTier(tier: string | null | undefined): boolean {
  return typeof tier === "string" && tier.trim().toUpperCase().startsWith("R");
}


export function activeFromTier(tier: string | null | undefined): string | null {
  const t = cleanTier(tier);
  if (!t) return null;
  return t.startsWith("R") ? t.slice(1) : t;
}


export function retiredFromPeak(peak: string | null | undefined): Tier | null {
  const t = cleanTier(peak);
  if (!t) return null;
  const r = ("R" + t) as string;
  return TIER_SET.has(r) ? (r as Tier) : null;
}


export function pointsForTier(tier: string | null | undefined): number {
  return TIER_POINTS[cleanTier(tier) as Tier] ?? 0;
}


const SPECIAL_TIERS = new Set(["UNRANKED", "NONE", "UNR", "NA", "N/A", "-", ""]);


export function cleanTier(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const t = input.trim().toUpperCase();
  if (!t || SPECIAL_TIERS.has(t)) return null;
  return t;
}


export function tierNumber(tier: string | null | undefined): number | null {
  const t = cleanTier(tier);
  const m = t?.match(/^R?[LH]T([1-5])$/);
  return m ? Number(m[1]) : null;
}


export function tiersInGroup(n: number): Tier[] {
  return TIERS.filter((t) => tierNumber(t) === n);
}


export const TIER_GROUP_LABEL: Record<number, string> = {
  5: "Tier 5",
  4: "Tier 4",
  3: "Tier 3",
  2: "Tier 2",
  1: "Tier 1",
};


export function tierRank(tier: string | null | undefined): number {
  return pointsForTier(tier);
}


export function tierStyle(tier: string | null | undefined) {
  switch (cleanTier(tier)) {
    case "HT1":
    case "RHT1":
    case "RHT1":
      return { text: "text-ink-100", bg: "bg-mint-500/20", ring: "ring-mint-400/60", dot: "bg-mint-300" };
    case "LT1":
    case "RLT1":
    case "RLT1":
      return { text: "text-ink-100", bg: "bg-mint-500/15", ring: "ring-mint-400/40", dot: "bg-mint-400" };
    case "HT2":
    case "RHT2":
    case "RHT2":
      return { text: "text-mint-300", bg: "bg-brand-500/15", ring: "ring-brand-400/50", dot: "bg-brand-300" };
    case "LT2":
    case "RLT2":
    case "RLT2":
      return { text: "text-brand-300", bg: "bg-navy-800", ring: "ring-brand-400/40", dot: "bg-brand-400" };
    case "LT5":
    case "RLT5":
      return { text: "text-mint-300", bg: "bg-mint-500/15", ring: "ring-mint-400/40", dot: "bg-mint-300" };
    case "HT5":
    case "RHT5":
      return { text: "text-brand-300", bg: "bg-brand-500/15", ring: "ring-brand-400/40", dot: "bg-brand-300" };
    case "LT4":
    case "RLT4":
      return { text: "text-mint-300", bg: "bg-navy-800", ring: "ring-mint-400/30", dot: "bg-mint-400" };
    case "HT4":
    case "RHT4":
      return { text: "text-brand-300", bg: "bg-navy-800", ring: "ring-brand-400/30", dot: "bg-brand-400" };
    case "LT3":
    case "RLT3":
      return { text: "text-ink-100", bg: "bg-navy-800", ring: "ring-mint-400/20", dot: "bg-mint-500" };
    case "HT3":
    case "RHT3":
      return { text: "text-ink-100", bg: "bg-navy-800", ring: "ring-brand-400/20", dot: "bg-brand-500" };
    default:
      return { text: "text-ink-500", bg: "bg-navy-800", ring: "ring-slate-200", dot: "bg-ink-500" };
  }
}


export const GAMEMODE_ICON: Record<string, string> = {
  overall: "/icons/overall.svg",
  sword: "/icons/sword.svg",
  mace: "/icons/mace.svg",
  axe: "/icons/axe.svg",
  diapot: "/icons/diapot.svg",
  nethpot: "/icons/nethpot.svg",
  smp: "/icons/smp.svg",
  crystal: "/icons/crystal.svg",
  uhc: "/icons/uhc.svg",
  spearmace: "/icons/spearmace.webp",
  diasmp: "/icons/diasmp.png",
  manhunt: "/icons/manhunt.webp",
  shieldlessuhc: "/icons/shieldlessuhc.webp",
  cart: "/icons/cart.png",
};

export function gamemodeIcon(id: string) {
  return GAMEMODE_ICON[id] ?? GAMEMODE_ICON.overall;
}


export const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/AsianTiers";
