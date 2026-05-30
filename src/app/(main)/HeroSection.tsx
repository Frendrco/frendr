"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useAuth } from "@clerk/nextjs"

const BLOBS = [
  { id: 1, bg: "bg-bloom-lavender", style: { top: "12%",    left:  "6%",  width: 192, height: 192 } },
  { id: 2, bg: "bg-sky-blue",       style: { top:  "6%",    right: "9%",  width: 152, height: 152 } },
  { id: 3, bg: "bg-sunny-yellow",   style: { bottom: "18%", left:  "11%", width: 112, height: 112 } },
  { id: 4, bg: "bg-winter-green",   style: { bottom: "10%", right: "6%",  width: 208, height: 208 } },
]

export function HeroSection() {
  const { isSignedIn } = useAuth()
  const { scrollY } = useScroll()

  // Blobs — larger = faster, more exaggerated movement
  const blob4Y = useTransform(scrollY, [0, 800], [0, -280])  // 208px — largest, fastest
  const blob1Y = useTransform(scrollY, [0, 800], [0, -220])  // 192px
  const blob2Y = useTransform(scrollY, [0, 800], [0, -140])  // 152px
  const blob3Y = useTransform(scrollY, [0, 800], [0, -70])   // 112px — smallest, slowest

  const blobY = { 1: blob1Y, 2: blob2Y, 3: blob3Y, 4: blob4Y }

  // Headline and logo move at different rates to create depth
  const headlineY = useTransform(scrollY, [0, 800], [0, -50])
  const logoY     = useTransform(scrollY, [0, 800], [0, -110])

  return (
    <section className="relative -mt-16 min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-16">

      {/* Floating blobs */}
      {BLOBS.map((b) => (
        <motion.div
          key={b.id}
          className={`absolute rounded-full ${b.bg} hidden sm:block`}
          style={{ ...b.style, y: blobY[b.id as keyof typeof blobY] }}
        />
      ))}

      {/* Centre stack */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">

        <motion.h1
          className="display-md text-core-black"
          style={{ y: headlineY }}
        >
          Designed for creativity.<br />Built for belonging.
        </motion.h1>

        <motion.div
          className="-mt-4 w-[280px] sm:w-[380px] md:w-[460px] lg:w-[520px]"
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

        {!isSignedIn && (
          <motion.div style={{ y: headlineY }}>
            <Link
              href="/sign-up"
              className="mt-6 inline-flex h-11 items-center px-8 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90"
            >
              Join Free
            </Link>
          </motion.div>
        )}

      </div>
    </section>
  )
}
