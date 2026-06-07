"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Camera, Film, Pencil } from "lucide-react"

interface Props {
  initialCoverUrl:      string | null
  initialCoverVideoUrl: string | null
  isOwn:                boolean
}

export function CoverImage({ initialCoverUrl, initialCoverVideoUrl, isOwn }: Props) {
  const [coverUrl,       setCoverUrl]       = useState(initialCoverUrl)
  const [coverVideoUrl,  setCoverVideoUrl]  = useState(initialCoverVideoUrl)
  const [uploading,      setUploading]      = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [menuOpen,       setMenuOpen]       = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const busy = uploading || uploadingVideo

  useEffect(() => {
    if (!menuOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [menuOpen])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    setMenuOpen(false)
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    fetch("/api/users/upload-cover", { method: "POST", body: form })
      .then((r) => r.json())
      .then(async (data: { coverUrl?: string }) => {
        if (data.coverUrl) {
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverImageUrl: data.coverUrl }),
          })
          setCoverUrl(data.coverUrl)
        }
      })
      .finally(() => setUploading(false))
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    setMenuOpen(false)
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Video is too large — must be under 5 MB")
      return
    }
    setError(null)
    setUploadingVideo(true)
    const form = new FormData()
    form.append("file", file)
    fetch("/api/users/upload-cover-video", { method: "POST", body: form })
      .then((r) => r.json())
      .then(async (data: { coverUrl?: string; error?: string }) => {
        if (!data.coverUrl) {
          setError(data.error ?? "Video upload failed")
          return
        }
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverVideoUrl: data.coverUrl }),
        })
        setCoverVideoUrl(data.coverUrl)
      })
      .catch(() => setError("Video upload failed"))
      .finally(() => setUploadingVideo(false))
  }

  return (
    <div className="relative w-full h-[200px] bg-mist-grey">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {coverVideoUrl ? (
          <video
            src={coverVideoUrl}
            autoPlay loop muted playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : coverUrl ? (
          <Image src={coverUrl} alt="Cover" fill sizes="100vw" className="object-cover" />
        ) : null}
      </div>

      {isOwn && (
        <div ref={menuRef} className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition-colors hover:bg-black/60 disabled:opacity-50"
            >
              <Pencil size={12} />
              {uploading || uploadingVideo ? "Uploading…" : "Edit cover"}
            </button>

            {error && (
              <p className="rounded-lg bg-black/70 px-3 py-1.5 font-sans text-xs text-red-400 backdrop-blur">
                {error}
              </p>
            )}

            {menuOpen && (
              <div className="flex flex-col overflow-hidden rounded-lg border border-white/20 bg-black/70 backdrop-blur text-xs text-white font-sans shadow-lg">
                <label className="relative flex cursor-pointer items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" />
                  <Camera size={13} />
                  Photo
                </label>
                <label className="relative flex cursor-pointer items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors border-t border-white/10">
                  <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" />
                  <Film size={13} />
                  Video
                </label>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
