"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    // Store in localStorage for demo
    try {
      const subs = JSON.parse(localStorage.getItem("gaspe_newsletter") ?? "[]");
      if (!subs.includes(email)) {
        subs.push(email);
        localStorage.setItem("gaspe_newsletter", JSON.stringify(subs));
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--gaspe-teal-400)]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Inscription confirmée !
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
        placeholder="votre@email.fr"
        className={`flex-1 rounded-xl bg-white/10 border px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-colors ${
          status === "error" ? "border-red-400" : "border-white/10 focus:border-[var(--gaspe-teal-400)]"
        }`}
        aria-label="Adresse email pour la newsletter"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-500)] transition-colors"
      >
        S&apos;inscrire
      </button>
    </form>
  );
}
