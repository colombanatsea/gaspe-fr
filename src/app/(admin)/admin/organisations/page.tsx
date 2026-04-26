"use client";

/* /admin/organisations → redirige vers /admin/adherents (session 40, fusion).
 * Conservé pour rétrocompatibilité des bookmarks et liens externes. */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrganisationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/adherents");
  }, [router]);

  return (
    <div className="py-12 text-center text-sm text-foreground-muted">
      Redirection vers la nouvelle page Adhérents…
    </div>
  );
}
