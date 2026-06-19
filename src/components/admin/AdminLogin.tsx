"use client";

import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid password");
        return;
      }

      onLogin();
    } catch {
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-65px)] items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md border border-white/10 bg-black/60 p-6 backdrop-blur-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo className="mb-4 h-16" />
          <h1 className="slogan-text text-lg text-white">ADMIN PORTAL</h1>
          <p className="mt-2 text-xs text-white/40">Manage listings and uploads</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-xs tracking-widest text-white/50">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-white/20 bg-black px-4 py-3 text-white outline-none focus:border-[var(--color-de-primary)]"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="glow-border w-full border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 py-3 text-sm tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25 disabled:opacity-50"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
