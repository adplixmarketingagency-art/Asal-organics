"use client";
import { useState } from "react";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";

export function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  return <form className="admin-login" onSubmit={async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", "X-Asal-Admin": "1" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to sign in.");
      form.reset();
      window.location.replace("/admin/orders");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in. Try again.");
      setBusy(false);
    }
  }}>
    <label htmlFor="owner-email">Email address</label>
    <input id="owner-email" name="email" type="email" autoComplete="username" required maxLength={254} autoCapitalize="none" spellCheck={false} />
    <label htmlFor="owner-password">Password</label>
    <div className="admin-password">
      <input id="owner-password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required maxLength={256} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
    {error && <p className="admin-message error" role="alert">{error}</p>}
    <button className="admin-button primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <ArrowUpRight size={17} /></button>
    <p className="admin-small">Private owner access. Your session lasts up to 8 hours.</p>
  </form>;
}
