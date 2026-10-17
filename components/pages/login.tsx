"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (result?.error) setError("Invalid email or password.");
    else {
      const session = await fetch("/api/session").then((r) => r.json());
      router.push(
        session?.user?.role === "TENANT"
          ? "/tenant"
          : session?.user?.role === "TECHNICIAN"
            ? "/technician"
            : "/",
      );
    }
  }
  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <strong>
              FixFlow<span>AI</span>
            </strong>
            <small>Property operations</small>
          </div>
        </div>
        <span className="eyebrow">
          <Sparkles size={13} /> Secure workspace
        </span>
        <h1>Welcome back</h1>
        <p>Sign in to manage smarter property maintenance.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button className="primary-btn login-btn" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
