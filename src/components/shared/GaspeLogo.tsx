/**
 * GASPE Logo — uses the official logo-gaspe.jpg
 */
export function GaspeLogo({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logo-gaspe.jpg"
      alt="GASPE"
      width={size}
      height={size}
      className={`object-contain ${className ?? ""}`}
    />
  );
}

/**
 * GASPE Logo — variant with white background for dark surfaces
 */
export function GaspeLogoWhite({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-white overflow-hidden ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-gaspe.jpg"
        alt="GASPE"
        width={size - 4}
        height={size - 4}
        className="object-contain"
      />
    </div>
  );
}
