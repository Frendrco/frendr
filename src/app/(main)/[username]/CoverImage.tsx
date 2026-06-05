"use client"

import { useState } from "react"
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

  const busy = uploading || uploadingVideo

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
      alert("Video must be under 5 MB. Aim for 2-3 MB — keep it 10-15 seconds, H.264/MP4.")
      return
    }
    setUploadingVideo(true)
    const form = new FormData()
    form.append("file", file)
    fetch("/api/users/upload-cover-video", { method: "POST", body: form })
      .then((r) => r.json())
      .then(async (data: { coverUrl?: string }) => {
        if (data.coverUrl) {
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverVideoUrl: data.coverUrl }),
          })
          setCoverVideoUrl(data.coverUrl)
        }
      })
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
        <>
          {menuOpen && (
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          )}

          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition-colors hover:bg-black/60 disabled:opacity-50"
            >
              <Pencil size={12} />
              {uploading || uploadingVideo ? "Uploading…" : "Edit cover"}
            </button>

            {menuOpen && (
              <div className="flex flex-col overflow-hidden rounded-lg border border-white/20 bg-black/70 backdrop-blur text-xs text-white font-sans shadow-lg">
                {/* Input is a child of label — browser activates it natively on label click,
                    no JS .click() and no clip/sr-only issues */}
                <label className="flex cursor-pointer items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors">
                  <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                  <Camera size={13} />
                  Photo
                </label>
                <label className="flex cursor-pointer items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors border-t border-white/10">
                  <input hidden type="file" accept="video/mp4" onChange={handleVideoChange} />
                  <Film size={13} />
                  Video
                </label>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
