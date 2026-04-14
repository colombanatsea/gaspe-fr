"use client";

import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { GaspeLogo } from "@/components/shared/GaspeLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <GaspeLogo size={40} />
        <span className="font-heading text-2xl font-bold text-foreground">{SITE_NAME}</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
