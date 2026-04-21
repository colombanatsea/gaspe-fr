"use client";

/**
 * Switcher mobile / tablet / desktop pour l'iframe d'aperçu CMS.
 * Les dimensions correspondent aux breakpoints Tailwind standards.
 */

export type PreviewDevice = "mobile" | "tablet" | "desktop";

export const DEVICE_DIMENSIONS: Record<
  PreviewDevice,
  { width: number; height: number; label: string }
> = {
  mobile: { width: 390, height: 844, label: "Mobile (iPhone 14)" },
  tablet: { width: 820, height: 1180, label: "Tablette (iPad Air)" },
  desktop: { width: 1280, height: 720, label: "Desktop (HD)" },
};

interface Props {
  value: PreviewDevice;
  onChange: (device: PreviewDevice) => void;
}

const ICONS: Record<PreviewDevice, React.ReactNode> = {
  mobile: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  tablet: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="12" y1="18.5" x2="12" y2="18.5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  desktop: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path strokeLinecap="round" d="M8 20h8M12 17v3" />
    </svg>
  ),
};

export function DevicePreviewSwitcher({ value, onChange }: Props) {
  const devices: PreviewDevice[] = ["mobile", "tablet", "desktop"];

  return (
    <div
      className="inline-flex rounded-lg border border-[var(--gaspe-neutral-200)] bg-white p-0.5"
      role="group"
      aria-label="Choisir la largeur de l'aperçu"
    >
      {devices.map((d) => {
        const isActive = value === d;
        const dim = DEVICE_DIMENSIONS[d];
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            aria-pressed={isActive}
            title={`${dim.label} (${dim.width}×${dim.height})`}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-[var(--gaspe-teal-600)] text-white"
                : "text-foreground-muted hover:text-foreground hover:bg-[var(--gaspe-neutral-100)]"
            }`}
          >
            {ICONS[d]}
            <span className="hidden sm:inline capitalize">{d}</span>
          </button>
        );
      })}
    </div>
  );
}
