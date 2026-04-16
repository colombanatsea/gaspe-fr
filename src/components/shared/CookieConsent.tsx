"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "gaspe_cookie_consent";

type ConsentState = "pending" | "accepted" | "rejected";

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(() => {
    if (typeof window === "undefined") return "accepted"; // default to hide (SSR)
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return "pending";
    return stored as ConsentState;
  });

  useEffect(() => {
    // Load CF Web Analytics only if consent is accepted
    if (consent === "accepted" && typeof window !== "undefined") {
      // CF Web Analytics beacon — replace token when connecting domain
      if (!document.getElementById("cf-analytics")) {
        const script = document.createElement("script");
        script.id = "cf-analytics";
        script.defer = true;
        script.src = "https://static.cloudflareinsights.com/beacon.min.js";
        script.setAttribute("data-cf-beacon", '{"token":"__CF_ANALYTICS_TOKEN__"}');
        document.head.appendChild(script);
      }
    }
  }, [consent]);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setConsent("rejected");
  }

  if (consent !== "pending") return null;

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6">
      <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl bg-[var(--gaspe-neutral-900)] border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-[var(--gaspe-teal-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <h3 className="font-heading text-sm font-semibold text-white">Respect de votre vie privée</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Nous utilisons des cookies d&apos;analyse anonymes (Cloudflare Web Analytics) pour améliorer votre expérience.
              Aucune donnée personnelle n&apos;est collectée. Vous pouvez accepter ou refuser.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={reject}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors"
            >
              Refuser
            </button>
            <button
              onClick={accept}
              className="rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--gaspe-teal-500)] transition-colors"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
