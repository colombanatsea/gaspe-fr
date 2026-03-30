"use client";

import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { CookieConsent } from "@/components/shared/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <CookieConsent />
      </AuthProvider>
    </ThemeProvider>
  );
}
