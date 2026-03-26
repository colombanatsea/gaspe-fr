import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl gaspe-gradient mb-6">
        <span className="font-heading text-2xl font-bold text-white">A</span>
      </div>
      <h1 className="font-heading text-5xl font-bold text-foreground">404</h1>
      <p className="mt-3 text-lg text-foreground-muted">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-8">
        <Button href="/">Retour à l&apos;accueil</Button>
      </div>
    </div>
  );
}
