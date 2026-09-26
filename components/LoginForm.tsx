"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const sb = getSupabase();
    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage("Account created. Check your email to confirm, then sign in.");
    }
    setBusy(false);
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border p-6"
        style={{ background: "var(--panel)", borderColor: "var(--line)" }}
      >
        <h1 className="text-2xl font-semibold">Habits</h1>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border bg-transparent px-3 py-2 outline-none focus:border-white/40"
          style={{ borderColor: "var(--line)" }}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border bg-transparent px-3 py-2 outline-none focus:border-white/40"
          style={{ borderColor: "var(--line)" }}
        />
        {message && <p className="text-sm text-yellow-400">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-white/90 py-2 font-medium text-black disabled:opacity-50"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="w-full text-sm"
          style={{ color: "var(--muted)" }}
        >
          {mode === "signin" ? "First time? Create account" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
