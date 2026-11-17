"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";

export function AdminLoginForm({ next = "/admin/dashboard" }: { next?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Login failed");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="card p-7">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 ring-1 ring-inset ring-brand-400/25">
          <Lock className="h-5 w-5 text-brand-300" />
        </div>
        <h1 className="mt-4 text-center font-display text-xl font-bold text-ink-100">Admin access</h1>
        <p className="mt-1 text-center text-xs text-ink-400">Password-only sign in. Sessions are secured server-side.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              className="input"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs text-brand-300">{error}</p>}
          <button className="btn-primary h-10 w-full" disabled={busy || !password}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-500">
          Protected route. Unauthorised access attempts are rate-limited.
        </p>
      </div>
    </div>
  );
}
