"use client"

import { useRef, useState } from "react"
import { VIBES_QUESTIONS, toggleVibe } from "@/lib/vibes"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
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

const DEFAULT_AVATARS = [
  "/images/ava-01.png",
  "/images/ava-02.png",
  "/images/ava-03.png",
  "/images/ava-04.png",
  "/images/ava-05.png",
]

const MAX_VIDEO_BYTES = 200 * 1024 * 1024

function toSlug(val: string) {
  return val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)

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

  // Post-creation (steps 4-5)
  const [createdUsername, setCreatedUsername] = useState("")

  // Step 4 — avatar
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)

  // Step 5 — vibes
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])

  // Step 6 — video
  const videoFileInputRef = useRef<HTMLInputElement>(null)
  const [videoSource,      setVideoSource]      = useState<"upload" | "link">("upload")
  const [videoFile,        setVideoFile]        = useState<File | null>(null)
  const [videoDragging,    setVideoDragging]    = useState(false)
  const [videoExternalUrl, setVideoExternalUrl] = useState("")
  const [videoTitle,       setVideoTitle]       = useState("")
  const [videoUploading,   setVideoUploading]   = useState(false)
  const [videoProgress,    setVideoProgress]    = useState(0)
  const [videoError,       setVideoError]       = useState<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────

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

  async function handleCreateAccount() {
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
    const userData = await res.json()
    setCreatedUsername(userData.username)
    setStep(4)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    await user.setProfileImage({ file })
    setCurrentAvatarUrl(null)
    e.target.value = ""
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  }

  async function pickAvatar(url: string) {
    setCurrentAvatarUrl(url)
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customAvatarUrl: url }),
    })
  }

  function handleVideoFileSelect(f: File) {
    if (f.type !== "video/mp4") { alert("Please select an MP4 file."); return }
    if (f.size > MAX_VIDEO_BYTES) { alert("File exceeds the 200 MB limit."); return }
    setVideoFile(f)
    if (!videoTitle) setVideoTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim())
  }

  async function handleVideoPost() {
    if (videoUploading) return
    setVideoUploading(true)
    setVideoError(null)
    setVideoProgress(0)
    try {
      if (videoSource === "link") {
        await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ externalUrl: videoExternalUrl.trim(), title: videoTitle.trim(), videoType: "PORTFOLIO", visibility: "PUBLIC"}),
        })
      } else {
        const urlRes = await fetch("/api/videos/upload-url", { method: "POST" })
        if (!urlRes.ok) throw new Error("Could not get upload URL")
        const { uid, uploadURL } = await urlRes.json() as { uid: string; uploadURL: string }
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100))
          })
          xhr.addEventListener("load", () => xhr.status < 400 ? resolve() : reject(new Error("Upload failed")))
          xhr.addEventListener("error", () => reject(new Error("Upload failed")))
          xhr.open("POST", uploadURL)
          const form = new FormData()
          form.append("file", videoFile!)
          xhr.send(form)
        })
        await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamId: uid, title: videoTitle.trim(), videoType: "PORTFOLIO", visibility: "PUBLIC"}),
        })
      }
      router.push(`/${createdUsername}`)
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Something went wrong")
      setVideoUploading(false)
      setVideoProgress(0)
    }
  }

  const displayAvatar = currentAvatarUrl ?? user?.imageUrl ?? null
  const initials      = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  const linkValid     = videoExternalUrl.trim().startsWith("https://") &&
    /vimeo\.com|youtube\.com|youtu\.be|framerate\./.test(videoExternalUrl)

  return (
    <div className="flex min-h-screen">

      {/* ── Left: form panel ── */}
      <div className="relative z-10 flex w-full flex-col bg-white md:w-1/2">
        <div className="flex flex-col px-8 py-10 md:px-14 lg:px-20">

          {/* Logo */}
          <Link href="/" className="mb-10 inline-flex pt-6">
            <Logo variant="wordmark" height={22} colour="black" />
          </Link>

          {/* Step progress dots */}
          <div className="flex gap-1.5 mb-8">
            {([1, 2, 3, 4, 5, 6] as const).map((n) => (
              <div key={n} className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                n === step ? "w-6 bg-core-black" : n < step ? "w-1.5 bg-core-black/30" : "w-1.5 bg-border"
              )} />
            ))}
          </div>

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
                onClick={handleCreateAccount}
                className="h-11 rounded-full bg-core-black font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80"
              >
                I agree &amp; join frendr
              </button>
            </div>
          )}

          {/* Step 4 — Profile picture ───────────────────── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-sans text-2xl font-bold text-core-black">
                  Add a profile picture
                </h1>
                <p className="mt-1.5 font-sans text-sm text-foreground/50">
                  Help people recognise you in the community.
                </p>
              </div>

              {/* Avatar preview + upload */}
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-border">
                  {displayAvatar ? (
                    <Image src={displayAvatar} alt={name} width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-spring-green font-sans font-bold text-2xl text-core-black">
                      {initials}
                    </div>
                  )}
                </div>
                <label className="relative inline-flex h-9 cursor-pointer items-center rounded-full border border-border px-5 font-sans font-medium text-sm text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground">
                  <input ref={avatarFileInputRef} type="file" accept="image/*" className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" onChange={handleAvatarChange} />
                  Upload photo
                </label>
              </div>

              {/* Preset avatars */}
              <div>
                <p className="mb-3 font-sans text-xs font-medium text-foreground/40 uppercase tracking-widest">
                  Or choose a default
                </p>
                <div className="flex gap-3">
                  {DEFAULT_AVATARS.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => pickAvatar(src)}
                      className={cn(
                        "h-12 w-12 overflow-hidden rounded-full transition-all",
                        currentAvatarUrl === src
                          ? "ring-2 ring-core-black ring-offset-2"
                          : "opacity-70 hover:opacity-100 hover:ring-2 hover:ring-border hover:ring-offset-2"
                      )}
                    >
                      <Image src={src} alt="" width={48} height={48} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="h-11 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="font-sans text-sm text-foreground/40 hover:text-foreground/60 transition-colors text-center"
                >
                  I&apos;ll do this later
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Vibes ──────────────────────────────── */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-sans text-2xl font-bold text-core-black">Your Vibes ✨</h1>
                  <p className="mt-1.5 font-sans text-sm text-foreground/50">All optional — just for fun.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="shrink-0 font-sans text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  Skip →
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {VIBES_QUESTIONS.map((q) => (
                  <div key={q.id} className="flex items-center gap-2">
                    {([q.a, q.b] as const).map((opt) => {
                      const on = selectedVibes.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedVibes((prev) => toggleVibe(prev, opt, q))}
                          className={[
                            "inline-flex h-8 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                            on
                              ? "border-core-black bg-core-black text-white"
                              : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground",
                          ].join(" ")}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (selectedVibes.length > 0) {
                    await fetch("/api/users", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ vibes: selectedVibes }),
                    })
                  }
                  setStep(6)
                }}
                className="h-11 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 6 — First video ────────────────────────── */}
          {step === 6 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-sans text-2xl font-bold text-core-black">
                  Share your first video
                </h1>
                <p className="mt-1.5 font-sans text-sm text-foreground/50">
                  Show the community what you&apos;re made of.
                </p>
              </div>

              {/* Source toggle */}
              <div className="flex gap-1 rounded-full border border-border bg-foreground/[0.03] p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setVideoSource("upload")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-4 font-sans font-medium text-sm transition-colors",
                    videoSource === "upload" ? "bg-core-black text-white" : "text-foreground/50 hover:text-foreground"
                  )}
                >
                  Upload file
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSource("link")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-4 font-sans font-medium text-sm transition-colors",
                    videoSource === "link" ? "bg-core-black text-white" : "text-foreground/50 hover:text-foreground"
                  )}
                >
                  Share a link
                </button>
              </div>

              {/* Upload mode — drag-and-drop zone */}
              {videoSource === "upload" && (
                <>
                  {videoFile || videoUploading ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setVideoDragging(true) }}
                      onDragLeave={() => setVideoDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setVideoDragging(false); const f = e.dataTransfer.files[0]; if (f) handleVideoFileSelect(f) }}
                      className="relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-border transition-all duration-150"
                    >
                      {videoUploading ? (
                        <div className="flex w-full flex-col items-center gap-4 px-8 text-center">
                          <p className="font-sans text-sm font-medium text-core-black">
                            {videoProgress < 100 ? "Uploading…" : "Processing…"}
                          </p>
                          <div className="w-full rounded-full bg-border" style={{ height: 6 }}>
                            {videoProgress === 0 ? (
                              <div className="h-full w-full animate-pulse rounded-full bg-spring-green/40" />
                            ) : (
                              <div className="h-full rounded-full bg-spring-green transition-all duration-500" style={{ width: `${videoProgress}%` }} />
                            )}
                          </div>
                          <span className="font-sans text-xs text-foreground/50">{videoProgress}%</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-8 text-center">
                          <p className="font-sans font-medium text-sm text-core-black">{videoFile!.name}</p>
                          <p className="font-sans text-xs text-foreground/40">{(videoFile!.size / 1024 / 1024).toFixed(1)} MB</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setVideoFile(null) }}
                            className="mt-1 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                          >
                            Change file
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => { e.preventDefault(); setVideoDragging(true) }}
                      onDragLeave={() => setVideoDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setVideoDragging(false); const f = e.dataTransfer.files[0]; if (f) handleVideoFileSelect(f) }}
                      className={cn(
                        "relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 transition-all duration-150",
                        videoDragging
                          ? "border-spring-green bg-spring-green/5 scale-[1.005] cursor-copy"
                          : "border-dashed border-border bg-foreground/[0.015] hover:border-foreground/25 hover:bg-foreground/[0.03]"
                      )}
                    >
                      <input ref={videoFileInputRef} type="file" accept="video/mp4" className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFileSelect(f) }} />
                      <div className="flex flex-col items-center gap-2 px-8 text-center">
                        <p className="font-sans font-medium text-sm text-core-black">
                          {videoDragging ? "Drop to upload" : "Drop your video here"}
                        </p>
                        <p className="font-sans text-xs text-foreground/40">or click to browse</p>
                      </div>
                    </label>
                  )}
                  <p className="text-center font-sans text-[11px] text-foreground/30 -mt-3">MP4 only · up to 200 MB</p>
                </>
              )}

              {/* Link mode */}
              {videoSource === "link" && (
                <div className="flex flex-col gap-1.5">
                  <input
                    type="url"
                    value={videoExternalUrl}
                    onChange={(e) => setVideoExternalUrl(e.target.value)}
                    placeholder="Vimeo, YouTube, or Framerate link…"
                    className="h-11 rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                  />
                  <p className="font-sans text-[11px] text-foreground/30">
                    Paste a link from Vimeo, YouTube, or Framerate
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-medium text-sm text-core-black">Title</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Give your video a title…"
                  className="h-11 rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                />
              </div>

              {videoError && <p className="font-sans text-xs text-red-500">{videoError}</p>}

              <div className="flex flex-col gap-3 mt-1">
                <button
                  type="button"
                  onClick={handleVideoPost}
                  disabled={
                    videoUploading ||
                    !videoTitle.trim() ||
                    (videoSource === "upload" ? !videoFile : !linkValid)
                  }
                  className="h-11 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {videoUploading
                    ? videoProgress < 100 ? "Uploading…" : "Processing…"
                    : "Publish Video"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/${createdUsername}`)}
                  className="font-sans text-sm text-foreground/40 hover:text-foreground/60 transition-colors text-center"
                >
                  Upload later
                </button>
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
