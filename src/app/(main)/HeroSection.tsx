"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useState, useRef, type ReactNode } from "react"

const BLOBS = [
  { id: 1, bg: "bg-bloom-lavender", style: { top: "24%",   left:  "6%",  width: 192, height: 192 } },
  { id: 2, bg: "bg-sky-blue",       style: { top: "18%",   right: "9%",  width: 152, height: 152 } },
  { id: 3, bg: "bg-sunny-yellow",   style: { bottom: "6%", left:  "11%", width: 152, height: 152 } },
  { id: 4, bg: "bg-winter-green",   style: { bottom: "-2%", right: "6%", width: 208, height: 208 } },
]

// Drop square .mp4 files into public/videos/hero/ to activate hover playback per blob.
// Empty string = blob stays as colour only (no hover interaction).
const HERO_CLIPS = [
  "/videos/hero/clip-1.mp4",
  "/videos/hero/clip-2.mp4",
  "/videos/hero/clip-3.mp4",
  "/videos/hero/clip-4.mp4",
]

export function HeroSection({ children }: { children?: ReactNode }) {
  const { scrollY } = useScroll()
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Blobs — larger = faster, more exaggerated movement
  const blob4Y = useTransform(scrollY, [0, 800], [0, -280])  // 208px — largest, fastest
  const blob1Y = useTransform(scrollY, [0, 800], [0, -220])  // 192px
  const blob2Y = useTransform(scrollY, [0, 800], [0, -140])  // 152px
  const blob3Y = useTransform(scrollY, [0, 800], [0, -140])  // 152px

  const blobY = { 1: blob1Y, 2: blob2Y, 3: blob3Y, 4: blob4Y }

  // Headline and logo move at different rates to create depth
  const headlineY = useTransform(scrollY, [0, 800], [0, -50])
  const logoY     = useTransform(scrollY, [0, 800], [0, -110])

  function handleHoverStart(id: number) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHoveredId(id)
    // Auto-fade back to colour after 4.5s even while still hovering
    timerRef.current = setTimeout(() => setHoveredId(null), 4500)
  }

  function handleHoverEnd() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHoveredId(null)
  }

  return (
    <section className="relative -mt-16 min-h-[80svh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-16">

      {/* Floating blobs */}
      {BLOBS.map((b, i) => {
        const clip = HERO_CLIPS[i] ?? ""
        const isHovered = hoveredId === b.id
        return (
          <motion.div
            key={b.id}
            className="absolute rounded-full overflow-hidden hidden sm:block"
            style={{ ...b.style, y: blobY[b.id as keyof typeof blobY] }}
            onHoverStart={() => clip && handleHoverStart(b.id)}
            onHoverEnd={handleHoverEnd}
          >
            {/* Colour fill */}
            <div
              className={`absolute inset-0 ${b.bg} transition-opacity duration-500 ease-in-out`}
              style={{ opacity: isHovered ? 0 : 1 }}
            />
            {/* Video — mounted only while hovered to avoid loading 4 streams on page load */}
            {clip && isHovered && (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={clip} type="video/mp4" />
              </video>
            )}
          </motion.div>
        )
      })}

      {/* Centre stack */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">

        <motion.h1
          className="font-display text-core-black tracking-[-0.05em]"
          style={{ y: headlineY, fontSize: "2.45rem", fontWeight: 400, lineHeight: 1.06 }}
        >
          Designed for creativity.<br />Built for belonging.
        </motion.h1>

        <motion.div
          className="-mt-4 w-[260px] sm:w-[460px] md:w-[560px] lg:w-[640px]"
          style={{ y: logoY }}
        >
          <Image
            src="/images/logo-3d.png"
            alt="frendr"
            width={520}
            height={260}
            className="w-full h-auto drop-shadow-sm"
            priority
          />
        </motion.div>

        {children && (
          <motion.div style={{ y: headlineY }}>
            {children}
          </motion.div>
        )}

      </div>
    </section>
  )
}
