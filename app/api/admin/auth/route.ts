import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidToken, verifyPassword } from "@/lib/session";
import { setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

// Simple in-memory throttle to slow brute-force attempts (per instance).
const attempts = new Map<string, { count: number; reset: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX = 8;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.reset > now && rec.count >= MAX) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!(await verifyPassword(password))) {
    const next = rec && rec.reset > now ? { count: rec.count + 1, reset: rec.reset } : { count: 1, reset: now + WINDOW };
    attempts.set(ip, next);
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  attempts.delete(ip);
  await setSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return NextResponse.json({ authenticated: await isValidToken(store.get(ADMIN_COOKIE)?.value) });
}
