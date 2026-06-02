"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Camera, X, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const SKILLS = [
  "Motion Design", "Animation", "3D", "Motion Graphics", "VFX",
  "2D Animation", "3D Animation", "3D Type", "Typography",
  "Branding", "Commercial", "Music Video", "Short Film", "Film",
  "Loop", "Experimental", "Stop Motion", "Sound",
  "Blender", "Cinema 4D", "After Effects", "Cavalry", "Houdini",
]
const MAX_SKILLS = 10
const BIO_MAX    = 150

interface Profile {
  displayName: string
  location:    string | null
  bio:         string | null
  website:     string | null
  role:        string | null
  instagram:   string | null
  linkedin:    string | null
  patreon:     string | null
  substack:    string | null
  playlist:    string | null
  behance:     string | null
  other:       string | null
  tags:        string[]
}

function extractHandle(value: string | null, ...prefixes: string[]): string {
  if (!value) return ""
  let v = value.trim().replace(/^@/, "").replace(/^https?:\/\//i, "").replace(/^www\./i, "")
  v = v.replace(/^[a-z]{2,3}\.(?=linkedin\.com|instagram\.com)/i, "")
  for (const p of prefixes) {
    if (v.toLowerCase().startsWith(p.toLowerCase())) v = v.slice(p.length)
  }
  return v.split("?")[0].split("/")[0]
}

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

const field = "h-11 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

export function EditProfileModal({ profile }: { profile: Profile }) {
  const router       = useRouter()
  const { user }     = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open,    setOpen]    = useState(false)
  const [saving,  setSaving]  = useState(false)

  const [firstName, setFirstName] = useState(profile.displayName.split(" ")[0] ?? "")
  const [lastName,  setLastName]  = useState(profile.displayName.split(" ").slice(1).join(" ") ?? "")
  const [location,  setLocation]  = useState(profile.location  ?? "")
  const [role,      setRole]      = useState(profile.role      ?? "")
  const [website,   setWebsite]   = useState(profile.website   ?? "")
  const [bio,       setBio]       = useState(profile.bio       ?? "")
  const [instagram, setInstagram] = useState(extractHandle(profile.instagram, "instagram.com/"))
  const [linkedin,  setLinkedin]  = useState(extractHandle(profile.linkedin, "linkedin.com/in/", "linkedin.com/"))
  const [patreon,   setPatreon]   = useState(profile.patreon   ?? "")
  const [substack,  setSubstack]  = useState(profile.substack  ?? "")
  const [playlist,  setPlaylist]  = useState(profile.playlist  ?? "")
  const [behance,   setBehance]   = useState(profile.behance   ?? "")
  const [other,     setOther]     = useState(profile.other     ?? "")
  const [tags,      setTags]      = useState<string[]>(profile.tags)

  // Re-sync state from latest server props each time the modal opens,
  // so stale initial state can't overwrite real DB values on save.
  useEffect(() => {
    if (!open) return
    setFirstName(profile.displayName.split(" ")[0] ?? "")
    setLastName(profile.displayName.split(" ").slice(1).join(" ") ?? "")
    setLocation(profile.location  ?? "")
    setRole(profile.role      ?? "")
    setWebsite(profile.website   ?? "")
    setBio(profile.bio       ?? "")
    setInstagram(extractHandle(profile.instagram, "instagram.com/"))
    setLinkedin(extractHandle(profile.linkedin, "linkedin.com/in/", "linkedin.com/"))
    setPatreon(profile.patreon   ?? "")
    setSubstack(profile.substack  ?? "")
    setPlaylist(profile.playlist  ?? "")
    setBehance(profile.behance   ?? "")
    setOther(profile.other     ?? "")
    setTags([...profile.tags])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const avatarUrl   = user?.imageUrl
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "User"
  const initials    = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    await user.setProfileImage({ file })
    router.refresh()
    e.target.value = ""
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < MAX_SKILLS ? [...prev, tag] : prev
    )
  }

  async function handleSave() {
    setSaving(true)
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        location:  location  || null,
        bio:       bio       || null,
        website:   website   || null,
        role:      role      || null,
        instagram: instagram || null,
        linkedin:  linkedin  || null,
        patreon:   patreon   || null,
        substack:  substack  || null,
        playlist:  playlist  || null,
        behance:   behance   || null,
        other:     other     || null,
        tags,
      }),
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-9 rounded-full border border-border bg-white font-sans text-sm font-medium text-core-black hover:bg-foreground/5 transition-colors"
      >
        Edit profile
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-lg p-0 gap-0 max-h-[90dvh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          {/* Pinned header */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-border">
            <DialogTitle className="font-sans text-base font-semibold text-core-black">
              Edit profile
            </DialogTitle>
            <DialogClose
              render={
                <button
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:bg-accent hover:text-foreground transition-colors"
                />
              }
            >
              <X size={16} />
            </DialogClose>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5">
            <div className="flex flex-col gap-5">

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={displayName} width={64} height={64} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-sans font-bold text-lg text-core-black">{initials}</span>
                  )}
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-white px-3 font-sans text-xs font-medium text-foreground/60 hover:bg-foreground/5 transition-colors"
                  >
                    <Camera size={12} /> Change photo
                  </button>
                </div>
              </div>

              <div className="-mx-4 h-px bg-border" />

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-medium text-foreground/50">First name</label>
                  <input className={field} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-medium text-foreground/50">Last name</label>
                  <input className={field} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              {/* Role + Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-medium text-foreground/50">Role</label>
                  <input className={field} placeholder="Motion Designer" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-medium text-foreground/50">Location</label>
                  <input className={field} placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              {/* Website */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-foreground/50">Website</label>
                <input className={field} placeholder="www.yoursite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs font-medium text-foreground/50">Bio</label>
                  <span className="font-sans text-xs text-foreground/30">{bio.length}/{BIO_MAX}</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={BIO_MAX}
                  placeholder="Tell the community about yourself…"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                />
              </div>

              {/* Social */}
              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs font-medium text-foreground/50">Social</label>

                {/* Instagram — handle only */}
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/40">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <div className={cn("flex items-center gap-0 flex-1", field, "px-0 overflow-hidden")}>
                    <span className="flex h-full items-center px-2 font-sans text-xs text-foreground/40 bg-foreground/5 border-r border-border select-none whitespace-nowrap">instagram.com/</span>
                    <input
                      className="flex-1 h-full bg-transparent px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
                      placeholder="yourhandle"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
                    />
                  </div>
                  {instagram && <button onClick={() => setInstagram("")} className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors"><X size={14} /></button>}
                </div>

                {/* LinkedIn — handle only */}
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/40">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <div className={cn("flex items-center gap-0 flex-1", field, "px-0 overflow-hidden")}>
                    <span className="flex h-full items-center px-2 font-sans text-xs text-foreground/40 bg-foreground/5 border-r border-border select-none whitespace-nowrap">linkedin.com/in/</span>
                    <input
                      className="flex-1 h-full bg-transparent px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
                      placeholder="yourhandle"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
                    />
                  </div>
                  {linkedin && <button onClick={() => setLinkedin("")} className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors"><X size={14} /></button>}
                </div>

                {/* URL fields */}
                {([
                  { key: "playlist", icon: <span className="font-sans font-bold text-xs">♫</span>, value: playlist, set: setPlaylist, placeholder: "open.spotify.com/playlist/…" },
                  { key: "substack", icon: <SubstackIcon />,  value: substack, set: setSubstack, placeholder: "yourname.substack.com" },
                  { key: "patreon",  icon: <PatreonIcon />,   value: patreon,  set: setPatreon,  placeholder: "patreon.com/yourname" },
                  { key: "behance",  icon: <BehanceIcon />,   value: behance,  set: setBehance,  placeholder: "www.behance.net/yourhandle" },
                  { key: "other",    icon: <Globe size={16} />, value: other,  set: setOther,    placeholder: "Any other link" },
                ] as const).map(({ key, icon, value, set, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/40">
                      {icon}
                    </div>
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
                        type="button"
                        onClick={() => toggleTag(skill)}
                        disabled={maxed}
                        className={cn(
                          "inline-flex h-7 items-center gap-1 rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                          on
                            ? "border-core-black bg-core-black text-white"
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

          {/* Pinned footer */}
          <div className="shrink-0 flex justify-end gap-2 border-t border-border bg-mist-grey/50 px-4 py-3 rounded-b-xl">
            <DialogClose render={<Button variant="outline" className="rounded-xl" />}>
              Cancel
            </DialogClose>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !firstName.trim()}
              className="inline-flex h-10 items-center rounded-xl bg-spring-green px-5 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
