import Image from "next/image"

type LogoVariant = "wordmark" | "symbol" | "combo"
type LogoColour = "black" | "white" | "auto"

interface LogoProps {
  variant?: LogoVariant
  colour?: LogoColour
  /**
   * Height in pixels. Width scales proportionally.
   * Wordmark default: 32px
   * Symbol default:   40px
   * Combo default:    40px
   */
  height?: number
  className?: string
  priority?: boolean
}

const DIMENSIONS: Record<LogoVariant, { width: number; height: number }> = {
  // Approximate aspect ratios from the SVG viewBoxes
  wordmark: { width: 320, height: 80 },
  symbol:   { width: 80,  height: 80 },
  combo:    { width: 400, height: 80 },
}

const DEFAULT_HEIGHTS: Record<LogoVariant, number> = {
  wordmark: 32,
  symbol:   40,
  combo:    40,
}

/**
 * Frendr Logo component
 *
 * Approved colour combinations (from brand guide):
 *   Spring Green bg → black logo
 *   Mist Grey bg    → black logo
 *   White bg        → black logo
 *   Core Black bg   → white logo  ← use colour="white" or colour="auto" with dark mode
 *
 * Clearspace:
 *   Wordmark: ¾ of logo height on all sides
 *   Symbol:   ⅓ of symbol height on all sides
 *
 * @example
 * // Standard header logo
 * <Logo variant="wordmark" />
 *
 * // Favicon / avatar
 * <Logo variant="symbol" height={48} />
 *
 * // Dark background
 * <Logo variant="wordmark" colour="white" />
 *
 * // Auto switches black/white based on dark mode class
 * <Logo variant="wordmark" colour="auto" />
 */
export function Logo({
  variant = "wordmark",
  colour = "auto",
  height,
  className,
  priority = false,
}: LogoProps) {
  const h = height ?? DEFAULT_HEIGHTS[variant]
  const dims = DIMENSIONS[variant]
  const w = Math.round((h / dims.height) * dims.width)

  const baseName = `logo-${variant}`

  if (colour === "auto") {
    // Render both and toggle visibility with Tailwind dark mode
    return (
      <>
        {/* Light mode — black logo */}
        <Image
          src={`/images/${baseName}.svg`}
          alt="Frendr"
          width={w}
          height={h}
          className={`dark:hidden ${className ?? ""}`}
          priority={priority}
        />
        {/* Dark mode — white logo */}
        <Image
          src={`/images/${baseName}-white.svg`}
          alt="Frendr"
          width={w}
          height={h}
          className={`hidden dark:block ${className ?? ""}`}
          priority={priority}
        />
      </>
    )
  }

  const src =
    colour === "white"
      ? `/images/${baseName}-white.svg`
      : `/images/${baseName}.svg`

  return (
    <Image
      src={src}
      alt="Frendr"
      width={w}
      height={h}
      className={className}
      priority={priority}
    />
  )
}
