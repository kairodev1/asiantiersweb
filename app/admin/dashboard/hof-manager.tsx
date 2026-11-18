"use client";

import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X, ImagePlus, Trophy, AlertTriangle } from "lucide-react";
import type { HallOfFameEntry } from "@/lib/supabase";
import { Head, Empty } from "@/lib/ui";

type Draft = { id?: string | number; ign: string; title: string; description: string; image: string };
const EMPTY: Draft = { ign: "", title: "", description: "", image: "" };

export function HofManager({ initialEntries, initialError }: { initialEntries: HallOfFameEntry[]; initialError: string | null }) {
  const [entries, setEntries] = useState<HallOfFameEntry[]>(initialEntries);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/hall-of-fame", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setEntries(json.entries ?? []);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const editing = draft.id !== undefined;
      const res = await fetch("/api/admin/hall-of-fame", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      await reload();
      setNotice(editing ? `Updated ${draft.ign}.` : `${draft.ign} was added to the Hall of Fame.`);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string | number) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/hall-of-fame?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      setEntries((prev) => prev.filter((e) => String(e.id) !== String(id)));
      setNotice("Entry deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
      setConfirmId(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      {}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-100">
            <Trophy className="h-4 w-4 text-mint-300" /> Hall of Fame entries
            <span className="rounded-md bg-slate-100 px-1.5 text-[11px] font-medium text-ink-300">{entries.length}</span>
          </h2>
          <button className="btn-primary h-8 px-3 text-xs" onClick={() => (setDraft({ ...EMPTY }), setError(null), setNotice(null))}>
            <Plus className="h-3.5 w-3.5" /> Add entry
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="p-4">
            <Empty title="No entries yet">Use “Add entry” to induct the first legend.</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {entries.map((entry) => (
              <li key={String(entry.id)} className="flex items-center gap-3 px-4 py-3">
                <Head ign={entry.ign} size={40} className="ring-1 ring-slate-200" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-100">{entry.ign}</p>
                  <p className="truncate text-[11px] text-mint-300/80">{entry.title || "—"}</p>
                  <p className="truncate text-[11px] text-ink-500">{entry.image || "No image"}</p>
                </div>
                <button
                  className="btn-ghost h-8 w-8 p-0"
                  title="Edit"
                  onClick={() =>
                    setDraft({
                      id: entry.id,
                      ign: entry.ign,
                      title: entry.title ?? "",
                      description: entry.description ?? "",
                      image: entry.image ?? "",
                    })
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {confirmId === String(entry.id) ? (
                  <div className="flex items-center gap-1">
                    <button className="btn-danger h-8 px-2.5 text-[11px]" disabled={busy} onClick={() => remove(entry.id)}>
                      Confirm
                    </button>
                    <button className="btn-ghost h-8 w-8 p-0" onClick={() => setConfirmId(null)} aria-label="Cancel">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button className="btn-ghost h-8 w-8 p-0 hover:border-brand-500/30 hover:text-brand-300" title="Delete" onClick={() => setConfirmId(String(entry.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {}
      <section className="card h-fit p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink-100">{draft ? (draft.id !== undefined ? "Edit entry" : "New entry") : "Entry editor"}</h2>
          {draft && (
            <button className="text-ink-400 hover:text-ink-100" onClick={() => setDraft(null)} aria-label="Close editor">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!draft ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
            <ImagePlus className="mx-auto h-6 w-6 text-ink-500" />
            <p className="mt-2 text-xs text-ink-400">Select an entry to edit, or add a new inductee.</p>
          </div>
        ) : (
          <form onSubmit={save} className="mt-4 space-y-3.5">
            <div>
              <label className="label" htmlFor="ign">Minecraft IGN</label>
              <input id="ign" className="input font-mono" value={draft.ign} onChange={(e) => setDraft({ ...draft, ign: e.target.value })} placeholder="Notch" required minLength={3} maxLength={16} pattern="[A-Za-z0-9_]{3,16}" />
            </div>
            <div>
              <label className="label" htmlFor="title">Title</label>
              <input id="title" className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="The First Legend" required maxLength={80} />
            </div>
            <div>
              <label className="label" htmlFor="description">Description</label>
              <textarea id="description" className="input min-h-[120px] resize-y" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Why this player is a legend…" maxLength={2000} />
              <p className="mt-1 text-right text-[10px] text-ink-500">{draft.description.length}/2000</p>
            </div>
            <div>
              <label className="label" htmlFor="image">Image URL</label>
              <input id="image" type="url" className="input" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} placeholder="https://…" />
              {draft.image && /^https?:\/\//.test(draft.image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt="Preview" className="mt-2 h-28 w-full rounded-lg border border-slate-200 object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-primary h-10 flex-1" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {draft.id !== undefined ? "Save changes" : "Add entry"}
              </button>
              <button type="button" className="btn-ghost h-10" onClick={() => setDraft(null)} disabled={busy}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs text-brand-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}
        {notice && <p className="mt-4 rounded-lg border border-mint-500/20 bg-mint-500/10 px-3 py-2 text-xs text-mint-300">{notice}</p>}
      </section>
    </div>
  );
}
