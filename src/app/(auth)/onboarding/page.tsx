"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/common/Logo"

// ── Tag categories ────────────────────────────────────────
const TAG_GROUPS = [
  {
    label: "Popular",
    tags: ["Motion Design", "Animation", "3D", "Typography", "Branding", "Film"],
  },
  {
    label: "Motion & VFX",
    tags: ["Motion Graphics", "3D Animation", "VFX", "Loop", "Experimental", "Sound"],
  },
  {
    label: "Film & Video",
    tags: ["Documentary", "Short Film", "Music Video", "Commercial", "Narrative"],
  },
  {
    label: "Design",
    tags: ["Graphic Design", "Illustration", "Photography", "UX/UI", "Print"],
  },
]

const MAX_TAGS = 3

// ── Right panel placeholder circles ──────────────────────
const FLOATING = [
  { bg: "bg-bloom-lavender", style: { top: "10%",   left: "10%",  width: 150, height: 150 } },
  { bg: "bg-sky-blue",       style: { top: "6%",    right: "8%",  width: 110, height: 110 } },
  { bg: "bg-sunny-yellow",   style: { bottom: "22%", left: "18%", width: 85,  height: 85  } },
  { bg: "bg-winter-green",   style: { bottom: "10%", right: "6%", width: 190, height: 190 } },
  { bg: "bg-dream-lilac",    style: { top: "48%",   right: "25%", width: 65,  height: 65  } },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 state
  const [name,     setName]     = useState("")
  const [location, setLocation] = useState("")
  const [age,      setAge]      = useState("")

  // Step 2 state
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < MAX_TAGS
        ? [...prev, tag]
        : prev
    )
  }

  function handleProfileContinue(e: React.FormEvent) {
    e.preventDefault()
    setStep(2)
  }

  async function handleFinish() {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, location, age, tags: selectedTags }),
    })
    router.push("/search")
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left: form panel ── */}
      <div className="relative z-10 flex w-full flex-col bg-white md:w-1/2">
        <div className="flex flex-col px-8 py-10 md:px-14 lg:px-20">

          {/* Logo */}
          <Link href="/" className="mb-10 inline-flex pt-6">
            <Logo variant="wordmark" height={22} colour="black" />
          </Link>

          {/* Step 1 — Profile ───────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleProfileContinue} className="flex flex-col gap-6">
              <div>
                <h1 className="font-sans text-2xl font-bold text-core-black">
                  Tell us about yourself
                </h1>
                <p className="mt-1.5 font-sans text-sm text-foreground/50">
                  Help the community get to know you.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-medium text-sm text-core-black">
                    Full name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                  />
                </div>

                {/* Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-medium text-sm text-core-black">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                  />
                </div>

                {/* Age */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-medium text-sm text-core-black">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="Your age"
                    min={13}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="mt-2 h-11 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2 — Tags ──────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6 pb-28">
              <div>
                <h1 className="font-sans text-2xl font-bold text-core-black">
                  What do you want to see?
                </h1>
                <p className="mt-1.5 font-sans text-sm text-foreground/50">
                  Choose 3 to personalise your feed. Your taste will refine it over time.
                </p>
              </div>

              {/* Tag groups */}
              <div className="flex flex-col gap-6">
                {TAG_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2.5 font-sans text-xs font-medium text-foreground/40 uppercase tracking-widest">
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-2">
                      {group.tags.map((tag) => {
                        const selected = selectedTags.includes(tag)
                        const maxed    = selectedTags.length >= MAX_TAGS && !selected
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            disabled={maxed}
                            className={cn(
                              "flex items-center justify-between rounded-xl border px-4 h-11 font-sans font-medium text-sm transition-colors",
                              selected
                                ? "border-spring-green bg-spring-green text-core-black"
                                : maxed
                                ? "border-border text-foreground/25 cursor-not-allowed"
                                : "border-border text-core-black hover:border-foreground/30"
                            )}
                          >
                            {tag}
                            <span className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                              selected
                                ? "border-core-black bg-core-black text-white"
                                : "border-foreground/30 text-foreground/40"
                            )}>
                              {selected ? "✓" : "+"}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2 — sticky bottom bar ─────────────────── */}
        {step === 2 && (
          <div className="fixed bottom-0 left-0 z-20 flex w-full items-center justify-between bg-core-black px-8 py-4 md:w-1/2 md:px-14 lg:px-20">
            <span className="font-sans font-medium text-sm text-white/50">
              Choose {MAX_TAGS}
            </span>
            <div className="flex items-center gap-4">
              <span className="font-sans text-sm text-white/50">
                <span className="text-white font-bold">{selectedTags.length}</span>
                {" / "}{MAX_TAGS}
              </span>
              <button
                onClick={handleFinish}
                disabled={selectedTags.length < MAX_TAGS}
                className="h-9 rounded-full bg-spring-green px-5 font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Finish
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: colour placeholder ── */}
      <div className="relative hidden overflow-hidden bg-spring-green md:flex md:w-1/2">
        {FLOATING.map((c, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${c.bg}`}
            style={c.style}
          />
        ))}
        <div className="absolute bottom-8 left-8">
          <Logo variant="wordmark" height={20} colour="black" />
          <p className="mt-2 font-sans text-xs text-core-black/50">
            Real craft. Real community.
          </p>
        </div>
      </div>

    </div>
  )
}
