"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/common/Logo"

// ── Tag categories ────────────────────────────────────────
const TAG_GROUPS = [
  {
    label: "Popular",
    tags: ["Motion Design", "Animation", "3D", "Typography", "Branding", "Film", "AI Video"],
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

const MAX_TAGS = 5

const RULES = [
  "Be kind and respectful to other creators.",
  "Only upload work you own the rights to.",
  "Tag any AI-generated content honestly.",
  "No AI slop — quality and craft matter here.",
  "Frendr is for everyone. Hate, harassment, and discrimination of any kind will result in immediate removal.",
]

function toSlug(val: string) {
  return val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1 state
  const [name,          setName]          = useState("")
  const [username,      setUsername]      = useState("")
  const [usernameDirty, setUsernameDirty] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const [location,      setLocation]      = useState("")
  const [age,           setAge]           = useState("")

  // Step 2 state
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Step 3 state
  const [showAiContent, setShowAiContent] = useState(true)

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < MAX_TAGS
        ? [...prev, tag]
        : prev
    )
  }

  function handleNameChange(val: string) {
    setName(val)
    if (!usernameDirty) setUsername(toSlug(val))
  }

  function handleUsernameChange(val: string) {
    setUsernameDirty(true)
    setUsername(val.toLowerCase().replace(/[^a-z0-9-]/g, ""))
  }

  function handleProfileContinue(e: React.FormEvent) {
    e.preventDefault()
    setUsernameError("")
    setStep(2)
  }

  async function handleFinish() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, username, location, age, tags: selectedTags, showAiContent }),
    })
    if (res.status === 409) {
      setUsernameError("That username is already taken. Please choose another.")
      setStep(1)
      return
    }
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
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                  />
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-medium text-sm text-core-black">
                    Username
                  </label>
                  <div className="flex h-11 items-center rounded-xl border border-border bg-white px-4 focus-within:ring-2 focus-within:ring-spring-green">
                    <span className="font-sans text-sm text-foreground/40 select-none">@</span>
                    <input
                      required
                      type="text"
                      placeholder="your-handle"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="flex-1 bg-transparent font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
                    />
                  </div>
                  {usernameError && (
                    <p className="font-sans text-xs text-red-500">{usernameError}</p>
                  )}
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
                  Choose up to 5 to personalise your feed. Your taste will refine it over time.
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

          {/* Step 3 — Community standards ──────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="font-sans text-2xl font-bold text-core-black">
                  A few house rules
                </h1>
                <p className="mt-1.5 font-sans text-sm text-foreground/50">
                  By joining frendr you agree to our community standards.
                </p>
              </div>

              {/* Rules */}
              <ul className="flex flex-col gap-3">
                {RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-spring-green text-xs font-bold text-core-black">✓</span>
                    <span className="font-sans text-sm text-core-black">{rule}</span>
                  </li>
                ))}
              </ul>

              {/* AI preference */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-sans font-medium text-sm text-core-black">Show AI-generated content</p>
                    <p className="mt-0.5 font-sans text-xs text-foreground/50">You can change this any time in settings.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiContent((v) => !v)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                      showAiContent ? "bg-spring-green" : "bg-foreground/20"
                    )}
                    role="switch"
                    aria-checked={showAiContent}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform",
                        showAiContent ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="h-11 rounded-full bg-core-black font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80"
              >
                I agree &amp; join frendr
              </button>
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
                onClick={() => setStep(3)}
                disabled={selectedTags.length < MAX_TAGS}
                className="h-9 rounded-full bg-spring-green px-5 font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: billboard ── */}
      <div className="relative sticky top-0 hidden h-screen md:flex md:w-1/2 bg-white">
        <Image src="/images/onboarding-billboard.jpg" alt="" fill className="object-cover" priority />
      </div>

    </div>
  )
}
