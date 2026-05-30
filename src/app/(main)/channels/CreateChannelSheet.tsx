"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Globe, Lock, Loader2, X, Search, ChevronRight, ChevronLeft, ImagePlus, Sparkles } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type UserResult = { id: string; username: string; displayName: string; avatarUrl: string | null }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
}

export function CreateChannelSheet({ open, onOpenChange, isAdmin = false }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isFrendrPick, setIsFrendrPick] = useState(false)
  const [adminSearch, setAdminSearch] = useState("")
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function reset() {
    setStep(1)
    setName("")
    setDescription("")
    setIsPublic(true)
    setIsFrendrPick(false)
    setAdminSearch("")
    setSearchResults([])
    setSelectedAdmins([])
    setCoverPreview(null)
    setCoverUrl(null)
    setCoverUploading(false)
    setCoverError("")
    setError("")
  }

  function handleClose(v: boolean) {
    onOpenChange(v)
    if (!v) reset()
  }

  function handleAdminSearch(q: string) {
    setAdminSearch(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSearchResults(
          (data as UserResult[]).filter((u) => !selectedAdmins.find((a) => a.id === u.id))
        )
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  function addAdmin(user: UserResult) {
    setSelectedAdmins((prev) => [...prev, user])
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id))
    setAdminSearch("")
  }

  function removeAdmin(id: string) {
    setSelectedAdmins((prev) => prev.filter((u) => u.id !== id))
  }

  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverError("")
    setCoverPreview(URL.createObjectURL(file))
    setCoverUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/channels/upload-cover", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setCoverUrl(data.coverUrl)
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      setCoverPreview(null)
    } finally {
      setCoverUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function clearCover() {
    setCoverPreview(null)
    setCoverUrl(null)
    setCoverError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function submit() {
    if (!name.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic,
          type: isFrendrPick ? "admin" : "user",
          coverUrl: coverUrl ?? undefined,
          admins: selectedAdmins.map((u) => u.id),
        }),
      })
      if (res.ok) {
        const channel = await res.json()
        handleClose(false)
        router.push(`/channels/${channel.slug}`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? "Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">

        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-sans font-semibold text-base text-core-black">
              {step === 1 && "Name your channel"}
              {step === 2 && "Who can see it?"}
              {step === 3 && "Add administrators"}
            </SheetTitle>
            <span className="font-sans text-xs text-foreground/40">Step {step} of 3</span>
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-spring-green transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </SheetHeader>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Step 1 — Basics + Cover */}
          {step === 1 && (
            <div className="flex flex-col gap-5">

              {/* Admin-only Frendr Picks toggle */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsFrendrPick((v) => !v)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    isFrendrPick ? "border-spring-green bg-spring-green/10" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <Sparkles size={16} className={`mt-0.5 shrink-0 ${isFrendrPick ? "text-core-black" : "text-foreground/40"}`} />
                  <div>
                    <p className="font-sans font-medium text-sm text-core-black">Mark as Frendr Pick</p>
                    <p className="font-sans text-xs text-foreground/50 mt-0.5">
                      Appears in the editorial Frendr Picks tab
                    </p>
                  </div>
                  <div className={`ml-auto mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${
                    isFrendrPick ? "border-spring-green bg-spring-green" : "border-foreground/30"
                  }`} />
                </button>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-core-black">Channel name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Best of Motion Design"
                  maxLength={60}
                  className="h-9 rounded-lg border border-border bg-transparent px-3 font-sans text-sm outline-none focus:border-foreground/30 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-core-black">
                  Description <span className="font-normal text-foreground/40">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this channel about?"
                  rows={3}
                  maxLength={280}
                  className="rounded-lg border border-border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
                />
              </div>

              {/* Cover image upload */}
              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs font-medium text-core-black">
                  Cover image <span className="font-normal text-foreground/40">(optional)</span>
                </label>

                <input
                  ref={fileInputRef}
                  id="cover-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleCoverSelect}
                />

                {coverPreview ? (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden">
                    <Image
                      src={coverPreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                    {coverUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-white" />
                      </div>
                    )}
                    {!coverUploading && (
                      <button
                        type="button"
                        onClick={clearCover}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="cover-upload"
                    className="flex flex-col items-center justify-center gap-2 aspect-video w-full rounded-xl border border-dashed border-border hover:border-foreground/30 transition-colors cursor-pointer"
                  >
                    <ImagePlus size={20} className="text-foreground/30" />
                    <span className="font-sans text-xs text-foreground/40">Click to upload</span>
                    <span className="font-sans text-[10px] text-foreground/30">JPG, PNG or WebP</span>
                  </label>
                )}

                {coverError && (
                  <p className="font-sans text-xs text-red-500">{coverError}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Visibility */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="font-sans text-sm text-foreground/60 mb-2">
                Choose who can find and follow <span className="font-medium text-core-black">{name}</span>.
              </p>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  isPublic ? "border-core-black bg-core-black/5" : "border-border hover:border-foreground/30"
                }`}
              >
                <Globe size={18} className="mt-0.5 shrink-0 text-foreground/60" />
                <div>
                  <p className="font-sans font-medium text-sm text-core-black">Public</p>
                  <p className="font-sans text-xs text-foreground/50 mt-0.5">
                    Anyone can find and follow this channel
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  !isPublic ? "border-core-black bg-core-black/5" : "border-border hover:border-foreground/30"
                }`}
              >
                <Lock size={18} className="mt-0.5 shrink-0 text-foreground/60" />
                <div>
                  <p className="font-sans font-medium text-sm text-core-black">Private</p>
                  <p className="font-sans text-xs text-foreground/50 mt-0.5">
                    Only you and administrators can see this channel
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Step 3 — Admins */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="font-sans text-sm text-foreground/60">
                Administrators can add and remove videos from{" "}
                <span className="font-medium text-core-black">{name}</span>. Optional — you can skip and add them later.
              </p>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  value={adminSearch}
                  onChange={(e) => handleAdminSearch(e.target.value)}
                  placeholder="Search by name or username…"
                  className="h-9 w-full rounded-lg border border-border bg-transparent pl-8 pr-3 font-sans text-sm outline-none focus:border-foreground/30 transition-colors"
                />
                {searching && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-foreground/40" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addAdmin(user)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-mist-grey transition-colors text-left border-b border-border last:border-0"
                    >
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.displayName}
                          width={28}
                          height={28}
                          className="rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-bloom-lavender shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-sans font-medium text-sm text-core-black truncate">{user.displayName}</p>
                        <p className="font-sans text-xs text-foreground/50">@{user.username}</p>
                      </div>
                      <span className="ml-auto font-sans text-xs text-spring-green font-medium shrink-0">Add</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedAdmins.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="font-sans text-xs font-medium text-foreground/50">Added administrators</p>
                  <div className="flex flex-col gap-1">
                    {selectedAdmins.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 rounded-lg bg-mist-grey px-3 py-2">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName}
                            width={24}
                            height={24}
                            className="rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-bloom-lavender shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-sans font-medium text-sm text-core-black truncate">{user.displayName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdmin(user.id)}
                          className="text-foreground/40 hover:text-foreground transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 py-5 border-t border-border flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5 font-sans text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 3 && (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="font-sans text-sm text-foreground/50 hover:text-foreground transition-colors px-3"
              >
                Skip
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !name.trim()}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-full bg-core-black font-sans font-medium text-sm text-white disabled:opacity-40 transition-opacity"
              >
                Continue
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading || coverUploading}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black disabled:opacity-40 transition-opacity"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Create Channel
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="px-6 pb-4 font-sans text-xs text-red-500">{error}</p>
        )}

      </SheetContent>
    </Sheet>
  )
}
