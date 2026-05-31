"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Camera, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileData {
  username: string
  displayName: string
  location: string | null
  age: number | null
  bio: string | null
  website: string | null
  role: string | null
  instagram: string | null
  linkedin: string | null
  twitter: string | null
  tags: string[]
}

const SKILLS = [
  "Motion Design", "Animation", "3D", "Typography", "Branding", "Film",
  "Motion Graphics", "VFX", "Loop", "Experimental", "Sound",
  "Documentary", "Short Film", "Music Video", "Commercial",
  "Stop Motion", "Live Action", "2D Animation", "3D Animation",
  "Graphic Design", "Illustration", "Photography", "UX/UI", "3D Type",
]

const MAX_SKILLS = 5
const BIO_MAX = 150
const EMOJI_AVATARS = ["🦥", "🐉", "🦀", "🐶"]

export function SettingsClient({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const { user } = useUser()
  const [tab, setTab] = useState<"basic" | "about">("basic")
  const [saving, setSaving] = useState(false)

  // Basic info
  const [firstName,     setFirstName]     = useState(profile.displayName.split(" ")[0] ?? "")
  const [lastName,      setLastName]      = useState(profile.displayName.split(" ").slice(1).join(" ") ?? "")
  const [username,      setUsername]      = useState(profile.username)
  const [usernameError, setUsernameError] = useState("")
  const [location,      setLocation]      = useState(profile.location ?? "")
  const [age,           setAge]           = useState(profile.age?.toString() ?? "")

  // About me
  const [role,      setRole]      = useState(profile.role ?? "")
  const [website,   setWebsite]   = useState(profile.website ?? "")
  const [bio,       setBio]       = useState(profile.bio ?? "")
  const [instagram, setInstagram] = useState(profile.instagram ?? "")
  const [linkedin,  setLinkedin]  = useState(profile.linkedin ?? "")
  const [twitter,   setTwitter]   = useState(profile.twitter ?? "")
  const [tags,      setTags]      = useState<string[]>(profile.tags)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarUrl    = user?.imageUrl
  const displayName  = [firstName, lastName].filter(Boolean).join(" ") || "User"
  const initials     = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    await user.setProfileImage({ file })
    router.refresh()
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < MAX_SKILLS
        ? [...prev, tag]
        : prev
    )
  }

  async function handleSave() {
    setUsernameError("")
    setSaving(true)
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          location:  location  || null,
          age:       age       ? Number(age) : null,
          bio:       bio       || null,
          website:   website   || null,
          role:      role      || null,
          instagram: instagram || null,
          linkedin:  linkedin  || null,
          twitter:   twitter   || null,
          tags,
        }),
      })
      if (res.status === 409) {
        setUsernameError("That username is already taken.")
        return
      }
      router.push(`/${username}`)
    } finally {
      setSaving(false)
    }
  }

  const field = "h-11 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Left panel ─────────────────────────────────── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-white overflow-y-auto">

        {/* Tab nav */}
        <nav className="flex flex-col px-6 pt-8">
          {(["basic", "about"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-11 text-left font-sans text-sm transition-colors",
                tab === t
                  ? "font-bold text-core-black"
                  : "font-medium text-foreground/40 hover:text-foreground/70"
              )}
            >
              {t === "basic" ? "Basic Information" : "About Me"}
            </button>
          ))}
        </nav>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 px-6 py-8">
          <div className="h-24 w-24 overflow-hidden rounded-full">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-spring-green font-sans font-bold text-2xl text-core-black">
                {initials}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-white px-3 font-sans text-xs font-medium text-foreground/60 hover:bg-foreground/5 transition-colors"
          >
            <Camera size={12} />
            Replace
          </button>
          <span className="font-sans text-[10px] text-foreground/35">or choose an avatar</span>
          <div className="flex gap-2">
            {EMOJI_AVATARS.map((emoji) => (
              <button
                key={emoji}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-lg hover:border-foreground/30 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Delete account */}
        <div className="px-6 pb-8">
          <button className="flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-border font-sans text-sm text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
            Delete Account
          </button>
        </div>
      </aside>

      {/* ── Right panel ────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex-1 overflow-y-auto px-10 py-8">

          {/* ── Basic Information ── */}
          {tab === "basic" && (
            <div className="max-w-2xl">
              <h2 className="mb-6 font-sans font-bold text-lg text-core-black">Basic Information</h2>
              <div className="flex flex-col gap-5">

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-medium text-foreground/50">First name</label>
                    <input className={field} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-medium text-foreground/50">Last name</label>
                    <input className={field} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-medium text-foreground/50">Username</label>
                  <div className={cn("flex items-center gap-0", field, "px-0 overflow-hidden")}>
                    <span className="flex h-full items-center px-3 font-sans text-sm text-foreground/40 bg-foreground/5 border-r border-border select-none">@</span>
                    <input
                      className="flex-1 h-full bg-transparent px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
                      placeholder="your-handle"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    />
                  </div>
                  {usernameError && (
                    <p className="font-sans text-xs text-red-500">{usernameError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-medium text-foreground/50">Location</label>
                  <input className={field} placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

              </div>
            </div>
          )}

          {/* ── About Me ── */}
          {tab === "about" && (
            <div className="max-w-2xl">
              <h2 className="mb-6 font-sans font-bold text-lg text-core-black">About Me</h2>
              <div className="flex flex-col gap-5">

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-medium text-foreground/50">Role</label>
                    <input className={field} placeholder="e.g. Motion Designer" value={role} onChange={(e) => setRole(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-medium text-foreground/50">Website</label>
                    <input className={field} placeholder="www.yoursite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-sans text-xs font-medium text-foreground/50">Bio</label>
                    <span className="font-sans text-xs text-foreground/30">{bio.length}/{BIO_MAX}</span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={BIO_MAX}
                    placeholder="Tell the community about yourself…"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                  />
                </div>

                {/* Social media */}
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-xs font-medium text-foreground/50">Social Media</label>

                  {([
                    { key: "instagram", label: "IG", value: instagram, set: setInstagram, placeholder: "www.instagram.com/handle" },
                    { key: "linkedin",  label: "in", value: linkedin,  set: setLinkedin,  placeholder: "www.linkedin.com/in/handle" },
                    { key: "twitter",   label: "X",  value: twitter,   set: setTwitter,   placeholder: "x.com/handle" },
                  ] as const).map(({ key, label, value, set, placeholder }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white font-sans font-bold text-xs text-foreground/40">
                        {label}
                      </div>
                      <input
                        className={cn(field, "flex-1")}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => set(e.target.value)}
                      />
                      {value && (
                        <button onClick={() => set("")} className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <label className="font-sans text-xs font-medium text-foreground/50">Skills</label>
                    <span className="font-sans text-xs text-foreground/30">{tags.length}/{MAX_SKILLS}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SKILLS.map((skill) => {
                      const on    = tags.includes(skill)
                      const maxed = !on && tags.length >= MAX_SKILLS
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleTag(skill)}
                          disabled={maxed}
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                            on    ? "border-core-black bg-core-black text-white"
                                  : maxed
                                  ? "border-border text-foreground/25 cursor-not-allowed"
                                  : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                          )}
                        >
                          {skill}
                          {on && <X size={10} className="ml-0.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-10 py-4">
          <button
            onClick={() => router.back()}
            className="h-10 px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
