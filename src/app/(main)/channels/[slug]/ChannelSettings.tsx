"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Settings, Loader2, X, ImagePlus, Trash2, UserPlus, UserMinus, Search, Link2, Copy, Check, RefreshCw } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type AdminUser = {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

const CHANNEL_COLORS: { key: string; bg: string }[] = [
  { key: "bloom-lavender", bg: "bg-bloom-lavender" },
  { key: "spring-green",   bg: "bg-spring-green" },
  { key: "winter-green",   bg: "bg-winter-green" },
  { key: "sky-blue",       bg: "bg-sky-blue" },
  { key: "sunny-yellow",   bg: "bg-sunny-yellow" },
  { key: "hyper-blue",     bg: "bg-hyper-blue" },
  { key: "dream-lilac",    bg: "bg-dream-lilac" },
]

type Props = {
  channel: {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    color: string | null
    isPublic: boolean
    shareToken: string | null
  }
  canDelete: boolean
  isOwner: boolean
}

export function ChannelSettings({ channel, canDelete, isOwner }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [name, setName] = useState(channel.name)
  const [description, setDescription] = useState(channel.description ?? "")
  const [coverPreview, setCoverPreview] = useState<string | null>(channel.coverUrl)
  const [coverUrl, setCoverUrl] = useState<string | null>(channel.coverUrl)
  const [color, setColor] = useState(channel.color ?? "bloom-lavender")
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  // Private link state
  const [shareToken, setShareToken] = useState<string | null>(channel.shareToken)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Admin management state
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [adminSearch, setAdminSearch] = useState("")
  const [adminResults, setAdminResults] = useState<AdminUser[]>([])
  const [adminSearching, setAdminSearching] = useState(false)
  const [adminAdding, setAdminAdding] = useState<string | null>(null)
  const [adminRemoving, setAdminRemoving] = useState<string | null>(null)
  const adminSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadAdmins = useCallback(async () => {
    const res = await fetch(`/api/channels/${channel.id}/admins`)
    if (res.ok) setAdmins(await res.json())
  }, [channel.id])

  useEffect(() => {
    if (open && isOwner) loadAdmins()
  }, [open, isOwner, loadAdmins])

  useEffect(() => {
    if (adminSearchTimeout.current) clearTimeout(adminSearchTimeout.current)
    if (!adminSearch.trim()) { setAdminResults([]); return }
    adminSearchTimeout.current = setTimeout(async () => {
      setAdminSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(adminSearch)}`)
        if (res.ok) {
          const all: AdminUser[] = await res.json()
          setAdminResults(all.filter((u) => !admins.some((a) => a.id === u.id)))
        }
      } finally {
        setAdminSearching(false)
      }
    }, 300)
  }, [adminSearch, admins])

  async function addAdmin(user: AdminUser) {
    setAdminAdding(user.id)
    try {
      const res = await fetch(`/api/channels/${channel.id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        setAdmins((prev) => [...prev, user])
        setAdminResults((prev) => prev.filter((u) => u.id !== user.id))
        setAdminSearch("")
      }
    } finally {
      setAdminAdding(null)
    }
  }

  async function removeAdmin(userId: string) {
    setAdminRemoving(userId)
    try {
      const res = await fetch(`/api/channels/${channel.id}/admins/${userId}`, { method: "DELETE" })
      if (res.ok) setAdmins((prev) => prev.filter((a) => a.id !== userId))
    } finally {
      setAdminRemoving(null)
    }
  }

  function handleOpen() {
    setName(channel.name)
    setDescription(channel.description ?? "")
    setColor(channel.color ?? "bloom-lavender")
    setCoverPreview(channel.coverUrl)
    setCoverUrl(channel.coverUrl)
    setCoverError("")
    setError("")
    setDeleteConfirm(false)
    setAdminSearch("")
    setAdminResults([])
    setOpen(true)
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
      setCoverPreview(channel.coverUrl)
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

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          coverUrl,
          color,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to save")
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function deleteChannel() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/channels/${channel.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/channels")
      router.refresh()
    } catch {
      setError("Failed to delete channel")
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border font-sans font-medium text-sm text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        <Settings size={14} />
        Edit
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">

          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="font-sans font-semibold text-base text-foreground">
              Edit channel
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-foreground">Channel name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="h-9 rounded-lg border border-border bg-transparent px-3 font-sans text-sm outline-none focus:border-foreground/30 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-foreground">
                Description <span className="font-normal text-foreground/40">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={280}
                className="rounded-lg border border-border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs font-medium text-foreground">
                Cover image <span className="font-normal text-foreground/40">(optional)</span>
              </label>

              {coverPreview ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden">
                  <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
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
                  className="relative flex flex-col items-center justify-center gap-2 aspect-video w-full rounded-xl border border-dashed border-border hover:border-foreground/30 transition-colors cursor-pointer"
                >
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" onChange={handleCoverSelect} />
                  <ImagePlus size={20} className="text-foreground/30" />
                  <span className="font-sans text-xs text-foreground/40">Click to upload</span>
                  <span className="font-sans text-[10px] text-foreground/30">JPG, PNG or WebP</span>
                </label>
              )}

              {coverError && <p className="font-sans text-xs text-red-500">{coverError}</p>}
            </div>

            {/* Background colour */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs font-medium text-foreground">
                Background colour
                <span className="ml-1 font-normal text-foreground/40">— used when no cover image is set</span>
              </label>
              <div className="flex gap-2">
                {CHANNEL_COLORS.map(({ key, bg }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    aria-label={key}
                    className={`h-8 w-8 rounded-full ${bg} transition-all duration-150 ${
                      color === key
                        ? "ring-2 ring-core-black ring-offset-2"
                        : "hover:scale-110"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Administrators */}
            {isOwner && (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-sans font-medium text-sm text-foreground">Administrators</p>
                  <p className="font-sans text-xs text-foreground/40 mt-0.5">
                    Admins can add and remove videos from this channel.
                  </p>
                </div>

                {/* Current admins */}
                {admins.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-2.5 py-1.5">
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {admin.avatarUrl
                            ? <Image src={admin.avatarUrl} alt={admin.displayName ?? admin.username} width={28} height={28} className="object-cover" />
                            : <div className="h-full w-full bg-bloom-lavender" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm text-foreground truncate">{admin.displayName ?? admin.username}</p>
                          <p className="font-sans text-[11px] text-foreground/40 truncate">@{admin.username}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdmin(admin.id)}
                          disabled={adminRemoving === admin.id}
                          className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {adminRemoving === admin.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <UserMinus size={13} />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search to add */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
                  <input
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search by name or username…"
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-transparent font-sans text-sm outline-none focus:border-foreground/30 transition-colors"
                  />
                  {adminSearching && (
                    <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-foreground/30" />
                  )}
                </div>

                {adminResults.length > 0 && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {adminResults.map((user) => (
                      <div key={user.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors">
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {user.avatarUrl
                            ? <Image src={user.avatarUrl} alt={user.displayName ?? user.username} width={28} height={28} className="object-cover" />
                            : <div className="h-full w-full bg-bloom-lavender" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm text-foreground truncate">{user.displayName ?? user.username}</p>
                          <p className="font-sans text-[11px] text-foreground/40 truncate">@{user.username}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addAdmin(user)}
                          disabled={adminAdding === user.id}
                          className="flex-shrink-0 inline-flex items-center gap-1 h-7 px-3 rounded-full bg-core-black font-sans font-medium text-[11px] text-white disabled:opacity-40 transition-opacity"
                        >
                          {adminAdding === user.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <UserPlus size={11} />
                          }
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Private link */}
            {!channel.isPublic && isOwner && (
              <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
                <div>
                  <p className="font-sans font-medium text-sm text-foreground flex items-center gap-1.5">
                    <Link2 size={13} className="text-foreground/40" />
                    Private link
                  </p>
                  <p className="font-sans text-xs text-foreground/50 mt-0.5">
                    Share this link with clients so they can view your private channel without an account.
                  </p>
                </div>
                {shareToken ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/channels/${channel.slug}?token=${shareToken}`}
                        className="flex-1 h-8 rounded-lg border border-border bg-foreground/[0.02] px-3 font-sans text-xs text-foreground/60 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/channels/${channel.slug}?token=${shareToken}`)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground/40 hover:text-foreground transition-colors shrink-0"
                      >
                        {copied ? <Check size={13} className="text-spring-green" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={tokenLoading}
                      onClick={async () => {
                        setTokenLoading(true)
                        const res = await fetch(`/api/channels/${channel.id}/share-token`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ revoke: true }),
                        })
                        const data = await res.json()
                        setShareToken(data.shareToken)
                        setTokenLoading(false)
                      }}
                      className="self-start inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      {tokenLoading ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                      Revoke link
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={tokenLoading}
                    onClick={async () => {
                      setTokenLoading(true)
                      const res = await fetch(`/api/channels/${channel.id}/share-token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({}),
                      })
                      const data = await res.json()
                      setShareToken(data.shareToken)
                      setTokenLoading(false)
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-core-black font-sans font-medium text-xs text-white hover:bg-spring-green hover:text-core-black transition-colors disabled:opacity-40 w-fit"
                  >
                    {tokenLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Generate private link
                  </button>
                )}
              </div>
            )}

            {/* Delete zone */}
            {canDelete && (
              <div className="mt-4 rounded-xl border border-red-200 p-4 flex flex-col gap-3">
                <div>
                  <p className="font-sans font-medium text-sm text-foreground">Delete channel</p>
                  <p className="font-sans text-xs text-foreground/50 mt-0.5">
                    Permanently removes the channel and all its video associations. Videos themselves are not deleted.
                  </p>
                </div>
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={deleteChannel}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 h-8 px-4 rounded-full bg-red-500 font-sans font-medium text-xs text-white disabled:opacity-50"
                    >
                      {deleting && <Loader2 size={12} className="animate-spin" />}
                      Yes, delete it
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full border border-red-200 font-sans font-medium text-xs text-red-500 hover:bg-red-50 transition-colors w-fit"
                  >
                    <Trash2 size={12} />
                    Delete channel
                  </button>
                )}
              </div>
            )}

          </div>

          <div className="px-6 py-5 border-t border-border flex items-center justify-between gap-3">
            {error && <p className="font-sans text-xs text-red-500 flex-1">{error}</p>}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-sans text-sm text-foreground/50 hover:text-foreground transition-colors px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !name.trim() || coverUploading}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-core-black font-sans font-medium text-sm text-white disabled:opacity-40 transition-opacity"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </div>

        </SheetContent>
      </Sheet>
    </>
  )
}
