"use client";

import Image from "next/image";

interface PaisaScoreLogoProps {
  /** Height of the logo image in pixels; width is auto */
  height?: number;
  className?: string;
}

/**
 * Renders the company-approved PaisaScore logo image.
 * Place /public/paisascore-logo.png with the exact asset from the brand team.
 */
export default function PaisaScoreLogo({ height = 40, className = "" }: PaisaScoreLogoProps) {
  return (
    <Image
      src="/paisascore-logo.png"
      alt="PaisaScore"
      height={height}
      width={height * 3.5} // Rectangular ratio
      className={`object-contain object-left ${className}`}
      priority
    />
  );
}

/** Icon-only crop for sidebars — shows just the speedometer part of the logo */
export function PaisaScoreIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/paisascore-logo.png"
        alt="PaisaScore icon"
        height={size * 2}
        width={size * 2 * 2.8}
        className="object-left object-contain scale-[1.4] origin-left translate-y-[-5%]"
        priority
      />
    </div>
  );
}
