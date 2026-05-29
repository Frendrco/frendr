"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ── Tags ─────────────────────────────────────────────────
const TAGS = [
  "Featured",
  "Motion Design",
  "Animation",
  "3D",
  "Typography",
  "Branding",
  "Film",
  "VFX",
  "Experimental",
  "Abstract",
  "Loop",
  "Sound",
  "Documentary",
  "3D Type",
]

// ── Selected by Frendr — curated collections ─────────────
const SELECTED = [
  {
    id: 1,
    title: "Fluid Identities",
    creator: "@motioncraft",
    count: "18 videos",
    bg: "bg-bloom-lavender",
  },
  {
    id: 2,
    title: "Type in Motion",
    creator: "@typeworks",
    count: "24 videos",
    bg: "bg-sky-blue",
  },
  {
    id: 3,
    title: "Abstract Worlds",
    creator: "@voidstudio",
    count: "11 videos",
    bg: "bg-sunny-yellow",
  },
  {
    id: 4,
    title: "Brand Stories",
    creator: "@narrativeco",
    count: "9 videos",
    bg: "bg-winter-green",
  },
  {
    id: 5,
    title: "Experimental Film",
    creator: "@rawframes",
    count: "15 videos",
    bg: "bg-dream-lilac",
  },
  {
    id: 6,
    title: "Sound & Vision",
    creator: "@audiomotion",
    count: "7 videos",
    bg: "bg-mist-grey",
  },
]

// ── Explore Video — grid ──────────────────────────────────
const EXPLORE = [
  { id: 1,  bg: "bg-bloom-lavender", title: "Ripple",    creator: "@wave.studio"  },
  { id: 2,  bg: "bg-sky-blue",       title: "Cascade",   creator: "@blueframe"    },
  { id: 3,  bg: "bg-sunny-yellow",   title: "Echo",      creator: "@soundviz"     },
  { id: 4,  bg: "bg-winter-green",   title: "Pulse",     creator: "@greenmotion"  },
  { id: 5,  bg: "bg-dream-lilac",    title: "Drift",     creator: "@lilacworks"   },
  { id: 6,  bg: "bg-mist-grey",      title: "Form",      creator: "@shapelab"     },
  { id: 7,  bg: "bg-bloom-lavender", title: "Static",    creator: "@noiseworks"   },
  { id: 8,  bg: "bg-sky-blue",       title: "Glide",     creator: "@smoothframes" },
  { id: 9,  bg: "bg-sunny-yellow",   title: "Spark",     creator: "@lightplay"    },
  { id: 10, bg: "bg-winter-green",   title: "Bloom",     creator: "@naturemotion" },
  { id: 11, bg: "bg-dream-lilac",    title: "Haze",      creator: "@fogstudio"    },
  { id: 12, bg: "bg-mist-grey",      title: "Core",      creator: "@centerpiece"  },
]

export default function SearchPage() {
  const [activeTag, setActiveTag] = useState("Featured")

  return (
    <div className="min-h-screen bg-white text-core-black">

      {/* ── Tag filter bar ── */}
      <div className="sticky top-16 z-40 bg-white border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6">
          <div
            className="flex items-center gap-2 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  "shrink-0 rounded-full px-4 h-8 font-sans font-medium text-sm transition-colors",
                  activeTag === tag
                    ? "bg-spring-green text-core-black"
                    : "border border-border bg-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8 flex flex-col gap-10">

        {/* Selected by Frendr */}
        <section>
          <h2 className="font-sans font-bold text-base text-core-black mb-4">
            Selected by Frendr
          </h2>

          {/* Horizontal scroll row */}
          <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4 md:-mx-6 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SELECTED.map((item) => (
              <Link key={item.id} href="#" className="shrink-0 group w-60">
                <div
                  className={cn(
                    "w-60 aspect-video rounded-xl mb-3 transition-opacity group-hover:opacity-90",
                    item.bg
                  )}
                />
                <p className="font-sans font-medium text-sm text-foreground leading-snug">
                  {item.title}
                </p>
                <p className="font-sans text-xs text-foreground/50 mt-0.5">
                  {item.creator} · {item.count}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Explore Video */}
        <section>
          <h2 className="font-sans font-bold text-base text-core-black mb-4">
            Explore Video
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {EXPLORE.map((video) => (
              <Link key={video.id} href="#" className="group">
                <div
                  className={cn(
                    "aspect-video rounded-xl mb-2 transition-opacity group-hover:opacity-90",
                    video.bg
                  )}
                />
                <p className="font-sans font-medium text-sm text-foreground leading-snug">
                  {video.title}
                </p>
                <p className="font-sans text-xs text-foreground/50 mt-0.5">
                  {video.creator}
                </p>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
