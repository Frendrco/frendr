"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Camera, X, Globe, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { VIBES_QUESTIONS, toggleVibe } from "@/lib/vibes"

const DEFAULT_AVATARS = [
  "/images/ava-01.png",
  "/images/ava-02.png",
  "/images/ava-03.png",
  "/images/ava-04.png",
  "/images/ava-05.png",
]

interface ProfileData {
  username: string
  displayName: string
  avatarUrl: string | null
  location: string | null
  age: number | null
  bio: string | null
  website: string | null
  role: string | null
  pronouns: string | null
  creatorType: string | null
  instagram: string | null
  linkedin: string | null
  patreon:  string | null
  substack: string | null
  playlist: string | null
  behance:  string | null
  other:    string | null
  tags: string[]
  vibes: string[]
  emailNotifyMessages: boolean
  emailNotifyComments: boolean
  emailNotifyReplies:  boolean
  emailNotifyFollows:  boolean
  emailNotifyTrending: boolean
}

const SKILLS = [
  "Motion Design", "Animation", "3D", "Motion Graphics", "VFX",
  "2D Animation", "3D Animation", "3D Type", "Typography",
  "Branding", "Commercial", "Music Video", "Short Film", "Film",
  "Loop", "Experimental", "Stop Motion", "Sound",
  "Creative Direction", "Art Direction", "Directing", "Producing",
  "Storyboard", "Illustration", "Character Design", "Compositing",
  "Blender", "Cinema 4D", "After Effects", "Cavalry", "Houdini", "Moho", "Toon Boom", "Rive",
]

const MAX_SKILLS = 10
const BIO_MAX = 150
const PRONOUN_PRESETS = ["he/him", "she/her", "they/them", "she/they", "he/they"]
const CREATOR_TYPES   = ["Freelancer", "Studio", "Student", "In-house"]
const EMOJI_AVATARS = ["🦥", "🐉", "🦀", "🐶"]

// Strip URL prefix to extract just the handle for Instagram / LinkedIn
function extractHandle(value: string | null, ...prefixes: string[]): string {
  if (!value) return ""
  let v = value.trim().replace(/^@/, "").replace(/^https?:\/\//i, "").replace(/^www\./i, "")
  // Strip regional subdomains like ca.linkedin.com → linkedin.com
  v = v.replace(/^[a-z]{2,3}\.(?=linkedin\.com|instagram\.com)/i, "")
  for (const p of prefixes) {
    if (v.toLowerCase().startsWith(p.toLowerCase())) v = v.slice(p.length)
  }
  return v.split("?")[0].split("/")[0]
}

// Strip query params from a URL
function stripQueryParams(value: string): string {
  return value.split("?")[0].trimEnd().replace(/\/$/, "")
}

function SubstackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  )
}

function PatreonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.18-3.22-7.18-7.18 0-3.97 3.21-7.21 7.18-7.21M2 21.6h3.5V2.41H2V21.6z" />
    </svg>
  )
}

function BehanceIcon() {
  return <span className="font-sans font-bold text-[11px] tracking-tight">Be</span>
}

export function SettingsClient({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const { user } = useUser()
  const [saving,         setSaving]         = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [deleting,       setDeleting]       = useState(false)

  // Basic info
  const [displayName,   setDisplayName]   = useState(profile.displayName)
  const [username,      setUsername]      = useState(profile.username)
  const [usernameError, setUsernameError] = useState("")
  const [location,      setLocation]      = useState(profile.location ?? "")

  // About me
  const [role,        setRole]        = useState(profile.role ?? "")
  const [pronouns,    setPronouns]    = useState(profile.pronouns ?? "")
  const [creatorType, setCreatorType] = useState(profile.creatorType ?? "")
  const [website,   setWebsite]   = useState(profile.website ?? "")
  const [bio,       setBio]       = useState(profile.bio ?? "")
  // Instagram / LinkedIn: store just the handle
  const [instagram, setInstagram] = useState(extractHandle(profile.instagram, "instagram.com/"))
  const [linkedin,  setLinkedin]  = useState(extractHandle(profile.linkedin, "linkedin.com/in/", "linkedin.com/"))
  const [patreon,   setPatreon]   = useState(profile.patreon ?? "")
  const [substack,  setSubstack]  = useState(profile.substack ?? "")
  const [playlist,  setPlaylist]  = useState(profile.playlist ?? "")
  const [behance,   setBehance]   = useState(profile.behance ?? "")
  const [other,     setOther]     = useState(profile.other ?? "")
  const [tags,      setTags]      = useState<string[]>(profile.tags)
  const [vibes,     setVibes]     = useState<string[]>(profile.vibes ?? [])

  // Notification preferences
  const [notifyMessages,  setNotifyMessages]  = useState(profile.emailNotifyMessages)
  const [notifyComments,  setNotifyComments]  = useState(profile.emailNotifyComments)
  const [notifyReplies,   setNotifyReplies]   = useState(profile.emailNotifyReplies)
  const [notifyFollows,   setNotifyFollows]   = useState(profile.emailNotifyFollows)
  const [notifyTrending,  setNotifyTrending]  = useState(profile.emailNotifyTrending)

  async function saveNotifPref(field: string, value: boolean) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    })
  }

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(profile.avatarUrl)

  const displayAvatar  = currentAvatarUrl ?? user?.imageUrl ?? null
  const initials       = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const input = e.target
    if (!file || !user) return
    await user.setProfileImage({ file })
    setCurrentAvatarUrl(null)
    input.value = ""
    // Sync new Clerk URL to DB — hasImage is now true so PATCH will save it
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
          bio:       bio       || null,
          website:   website   || null,
          role:        role        || null,
          pronouns:    pronouns    || null,
          creatorType: creatorType || null,
          // Store handle only; profile page constructs full URL
          instagram: instagram || null,
          linkedin:  linkedin  || null,
          patreon:   patreon   || null,
          substack:  substack  || null,
          playlist:  playlist  || null,
          behance:   behance   || null,
          other:     other     || null,
          tags,
          vibes,
          // Preserve the selected default avatar — without this, the server
          // overwrites avatarUrl with the Clerk image on every save
          ...(currentAvatarUrl?.startsWith("/images/ava-") && { customAvatarUrl: currentAvatarUrl }),
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

  async function handleDeleteAccount() {
    setDeleting(true)
    await fetch("/api/users/me", { method: "DELETE" })
    await user?.delete()
    router.push("/")
  }

  const field = "h-11 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  const iconBadge = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-foreground/40"

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)] md:overflow-hidden">

      {/* ── Left panel ─────────────────────────────────── */}
      <aside className="flex flex-col items-center w-full md:w-64 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-white md:overflow-y-auto">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 px-6 py-6 md:py-8 w-full">
          <div className="h-24 w-24 overflow-hidden rounded-full">
            {displayAvatar ? (
              <Image src={displayAvatar} alt={displayName} width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-spring-green font-sans font-bold text-2xl text-core-black">
                {initials}
              </div>
            )}
          </div>
          <label className="relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3 font-sans text-xs font-medium text-foreground/60 hover:bg-foreground/5 transition-colors">
            <Camera size={12} />
            Replace
            <input
              type="file"
              accept="image/*"
              className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10"
              onChange={handleAvatarChange}
            />
          </label>
          <span className="font-sans text-[10px] text-foreground/35">or choose an avatar</span>
          <div className="flex gap-2">
            {DEFAULT_AVATARS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => pickAvatar(src)}
                className={cn(
                  "h-10 w-10 overflow-hidden rounded-xl border-2 transition-all",
                  currentAvatarUrl === src
                    ? "border-core-black scale-105"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <Image src={src} alt="Default avatar" width={40} height={40} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-1" />

        {/* Delete account */}
        <div className="px-6 pb-6 md:pb-8 w-full flex flex-col gap-2">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-border font-sans text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex flex-col gap-2">
              <p className="font-sans text-xs text-red-700 font-medium">Delete your account?</p>
              <p className="font-sans text-[11px] text-red-500 leading-relaxed">This permanently deletes your account and all your videos. Cannot be undone.</p>
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-8 rounded-lg border border-border font-sans text-xs font-medium text-foreground/60 hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 h-8 rounded-lg bg-red-500 font-sans text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Right panel ────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-8">

          <div className="max-w-2xl flex flex-col gap-5">

            {/* ── Basic Information ── */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-foreground/50">Display name</label>
              <input className={field} placeholder="Full name or studio name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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

            {/* Pronouns */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs font-medium text-foreground/50">Pronouns <span className="text-foreground/30">(optional)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {PRONOUN_PRESETS.map((p) => (
                  <button key={p} type="button" onClick={() => setPronouns(pronouns === p ? "" : p)}
                    className={cn("inline-flex h-7 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                      pronouns === p
                        ? "border-core-black bg-core-black text-white"
                        : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                    )}
                  >{p}</button>
                ))}
              </div>
              <input
                className={field}
                placeholder="or type your own…"
                value={PRONOUN_PRESETS.includes(pronouns) ? "" : pronouns}
                onChange={(e) => setPronouns(e.target.value)}
              />
            </div>

            {/* ── About Me divider ── */}
            <div className="flex items-center gap-3 pt-2">
              <span className="font-sans text-[10px] font-medium uppercase tracking-widest text-foreground/30 shrink-0">About Me</span>
              <div className="h-px flex-1 bg-border" />
            </div>

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

            {/* Creator type */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs font-medium text-foreground/50">I am a <span className="text-foreground/30">(optional)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {CREATOR_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setCreatorType(creatorType === t ? "" : t)}
                    className={cn("inline-flex h-7 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                      creatorType === t
                        ? "border-core-black bg-core-black text-white"
                        : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                    )}
                  >{t}</button>
                ))}
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

              {/* Instagram — handle only */}
              <div className="flex items-center gap-3">
                <div className={iconBadge}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className={cn("flex items-center gap-0 flex-1", field, "px-0 overflow-hidden")}>
                  <span className="flex h-full items-center px-3 font-sans text-xs text-foreground/40 bg-foreground/5 border-r border-border select-none whitespace-nowrap">instagram.com/</span>
                  <input
                    className="flex-1 h-full bg-transparent px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
                    placeholder="yourhandle"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
                  />
                </div>
                {instagram && (
                  <button onClick={() => setInstagram("")} className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* LinkedIn — handle only */}
              <div className="flex items-center gap-3">
                <div className={iconBadge}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <div className={cn("flex items-center gap-0 flex-1", field, "px-0 overflow-hidden")}>
                  <span className="flex h-full items-center px-3 font-sans text-xs text-foreground/40 bg-foreground/5 border-r border-border select-none whitespace-nowrap">linkedin.com/in/</span>
                  <input
                    className="flex-1 h-full bg-transparent px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
                    placeholder="yourhandle"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
                  />
                </div>
                {linkedin && (
                  <button onClick={() => setLinkedin("")} className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* URL fields — strip query params on blur */}
              {([
                { key: "playlist",  icon: <span className="font-sans font-bold text-xs">♫</span>,    value: playlist,  set: setPlaylist,  placeholder: "open.spotify.com/playlist/…" },
                { key: "substack",  icon: <SubstackIcon />,                                            value: substack,  set: setSubstack,  placeholder: "yourname.substack.com" },
                { key: "patreon",   icon: <PatreonIcon />,                                             value: patreon,   set: setPatreon,   placeholder: "patreon.com/yourname" },
                { key: "behance",   icon: <BehanceIcon />,                                             value: behance,   set: setBehance,   placeholder: "www.behance.net/yourhandle" },
                { key: "other",     icon: <Globe size={16} />,                                         value: other,     set: setOther,     placeholder: "Any other link" },
              ] as const).map(({ key, icon, value, set, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={iconBadge}>{icon}</div>
                  <input
                    className={cn(field, "flex-1")}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    onBlur={(e) => set(stripQueryParams(e.target.value))}
                  />
                  {value && (
                    <button onClick={() => set("")} className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* ── Notifications divider ── */}
            <div className="flex items-center gap-3 pt-2">
              <span className="font-sans text-[10px] font-medium uppercase tracking-widest text-foreground/30 shrink-0">Notifications</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col gap-1">
              {([
                { label: "Messages",   desc: "Email when someone sends you a message",          value: notifyMessages,  set: setNotifyMessages,  field: "emailNotifyMessages"  },
                { label: "Comments",   desc: "Email when someone comments on your video",       value: notifyComments,  set: setNotifyComments,  field: "emailNotifyComments"  },
                { label: "Replies",    desc: "Email when someone replies to your comment",      value: notifyReplies,   set: setNotifyReplies,   field: "emailNotifyReplies"   },
                { label: "Follows",    desc: "Email when someone follows you",                  value: notifyFollows,   set: setNotifyFollows,   field: "emailNotifyFollows"   },
                { label: "Milestones", desc: "Email when your video hits a view milestone",     value: notifyTrending,  set: setNotifyTrending,  field: "emailNotifyTrending"  },
              ] as { label: string; desc: string; value: boolean; set: (v: boolean) => void; field: string }[]).map(({ label, desc, value, set, field }) => (
                <div key={field} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
                  <div>
                    <p className="font-sans text-sm font-medium text-core-black">{label}</p>
                    <p className="font-sans text-xs text-foreground/40">{desc}</p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(next) => { set(next); saveNotifPref(field, next) }}
                  />
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-2 pb-4">
              <div className="flex items-baseline justify-between">
                <label className="font-sans text-xs font-medium text-foreground/50">Skills</label>
                <span className="font-sans text-xs text-foreground/30">{tags.length}/{MAX_SKILLS}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 md:justify-start">
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

            {/* Vibes */}
            <div className="flex flex-col gap-3 pb-4">
              <label className="font-sans text-xs font-medium text-foreground/50">Vibes</label>
              {VIBES_QUESTIONS.map((q) => (
                <div key={q.id} className="flex items-center gap-2">
                  {([q.a, q.b] as const).map((opt) => {
                    const on = vibes.includes(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setVibes((prev) => toggleVibe(prev, opt, q))}
                        className={cn(
                          "inline-flex h-7 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                          on
                            ? "border-core-black bg-core-black text-white"
                            : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                        )}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 border-t border-border px-5 py-4 md:justify-end md:px-10">
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
