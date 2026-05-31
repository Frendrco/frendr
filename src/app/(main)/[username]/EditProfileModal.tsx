"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Camera, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const SKILLS = [
  "Motion Design", "Animation", "3D", "Typography", "Branding", "Film",
  "Motion Graphics", "VFX", "Loop", "Experimental", "Sound",
  "Documentary", "Short Film", "Music Video", "Commercial",
  "Stop Motion", "Live Action", "2D Animation", "3D Animation",
  "Graphic Design", "Illustration", "Photography", "UX/UI", "3D Type",
]
const MAX_SKILLS = 5
const BIO_MAX    = 150

interface Profile {
  displayName: string
  location:    string | null
  bio:         string | null
  website:     string | null
  role:        string | null
  instagram:   string | null
  linkedin:    string | null
  twitter:     string | null
  tags:        string[]
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
  const [instagram, setInstagram] = useState(profile.instagram ?? "")
  const [linkedin,  setLinkedin]  = useState(profile.linkedin  ?? "")
  const [twitter,   setTwitter]   = useState(profile.twitter   ?? "")
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
    setInstagram(profile.instagram ?? "")
    setLinkedin(profile.linkedin  ?? "")
    setTwitter(profile.twitter   ?? "")
    setTags([...profile.tags])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const avatarUrl   = user?.imageUrl
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "User"
  const initials    = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

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
        twitter:   twitter   || null,
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
                {([
                  { key: "instagram", label: "IG", value: instagram, set: setInstagram, placeholder: "instagram.com/handle" },
                  { key: "linkedin",  label: "in", value: linkedin,  set: setLinkedin,  placeholder: "linkedin.com/in/handle" },
                  { key: "twitter",   label: "X",  value: twitter,   set: setTwitter,   placeholder: "x.com/handle" },
                ] as const).map(({ key, label, value, set, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border font-sans font-bold text-xs text-foreground/40">
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
