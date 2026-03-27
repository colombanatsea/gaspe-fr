"use client";

import { AuthProvider } from "@/lib/auth/AuthContext";
import { CookieConsent } from "@/components/shared/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CookieConsent />
    </AuthProvider>
  );
}
