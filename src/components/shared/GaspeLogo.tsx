import Image from "next/image";

/**
 * GASPE Logo — uses the official logo-gaspe.jpg
 */
export function GaspeLogo({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo-gaspe.jpg"
      alt="GASPE"
      width={size}
      height={size}
      unoptimized
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
      className={`flex items-center justify-center rounded-lg bg-white p-0.5 overflow-hidden ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-gaspe.jpg"
        alt="GASPE"
        width={size}
        height={size}
        unoptimized
        className="w-full h-full object-contain"
      />
    </div>
  );
}
