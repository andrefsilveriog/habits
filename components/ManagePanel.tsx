"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase, type Habit } from "@/lib/supabase";

export default function ManagePanel({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await getSupabase()
      .from("habits")
      .select("id,name,due_time,start_date,archived_at,created_at")
      .order("created_at");
    if (err) setError(err.message);
    else setHabits(data as Habit[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(op: PromiseLike<{ error: { message: string } | null }>) {
    const { error: err } = await op;
    if (err) setError(err.message);
    else setError(null);
    await load();
    onChanged();
  }

  const sb = () => getSupabase();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await run(sb().from("habits").insert({ name: trimmed, due_time: time || null }));
    setName("");
    setTime("");
  }

  const field = "rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-white/40";
  const line = { borderColor: "var(--line)" };

  return (
    <div className="fixed inset-0 z-10 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-lg flex-col gap-4 overflow-y-auto border-l p-5"
        style={{ background: "var(--panel)", borderColor: "var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Manage habits</h2>
          <button onClick={onClose} className="rounded-lg border px-3 py-1 text-sm hover:bg-white/10" style={line}>
            Close
          </button>
        </div>

        <form onSubmit={add} className="flex flex-wrap items-center gap-2">
          <input
            className={`${field} min-w-0 flex-1`}
            style={line}
            placeholder="New habit"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={field}
            style={line}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Due time (optional)"
          />
          <button type="submit" className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-black">
            Add
          </button>
        </form>
        <p className="-mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Due time is optional. With one, today stays gray until that time, then turns yellow.
        </p>

        {error && (
          <p className="text-sm" style={{ color: "var(--missed)" }}>
            {error}
          </p>
        )}

        <ul className="space-y-2">
          {habits.map((h) => {
            const archived = !!h.archived_at;
            return (
              <li
                key={h.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border p-2"
                style={{ ...line, opacity: archived ? 0.55 : 1 }}
              >
                <input
                  className={`${field} min-w-0 flex-1`}
                  style={line}
                  defaultValue={h.name}
                  maxLength={80}
                  aria-label="Habit name"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== h.name) run(sb().from("habits").update({ name: v }).eq("id", h.id));
                    else e.target.value = h.name;
                  }}
                />
                <input
                  className={field}
                  style={line}
                  type="time"
                  defaultValue={h.due_time?.slice(0, 5) ?? ""}
                  aria-label="Due time"
                  onBlur={(e) => {
                    const v = e.target.value || null;
                    if (v !== (h.due_time?.slice(0, 5) ?? null)) {
                      run(sb().from("habits").update({ due_time: v }).eq("id", h.id));
                    }
                  }}
                />
                <button
                  className="rounded-lg border px-2.5 py-1.5 text-sm hover:bg-white/10"
                  style={line}
                  onClick={() =>
                    run(sb().from("habits").update({ archived_at: archived ? null : new Date().toISOString() }).eq("id", h.id))
                  }
                >
                  {archived ? "Restore" : "Archive"}
                </button>
                {confirmId === h.id ? (
                  <button
                    className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-white"
                    style={{ background: "#b91c1c" }}
                    onClick={() => {
                      setConfirmId(null);
                      run(sb().from("habits").delete().eq("id", h.id));
                    }}
                    onBlur={() => setConfirmId(null)}
                    autoFocus
                  >
                    Delete forever?
                  </button>
                ) : (
                  <button
                    className="rounded-lg border px-2.5 py-1.5 text-sm hover:bg-white/10"
                    style={{ ...line, color: "var(--missed)" }}
                    onClick={() => setConfirmId(h.id)}
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
          {habits.length === 0 && (
            <li className="text-sm" style={{ color: "var(--muted)" }}>
              Nothing here yet.
            </li>
          )}
        </ul>

        <button
          onClick={() => getSupabase().auth.signOut()}
          className="mt-auto self-start text-sm underline"
          style={{ color: "var(--muted)" }}
        >
          Sign out
        </button>
      </aside>
    </div>
  );
}
