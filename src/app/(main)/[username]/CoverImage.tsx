"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, Loader2, X } from "lucide-react"

interface Props {
  initialCoverUrl:      string | null
  initialCoverVideoUrl: string | null
  isOwn:                boolean
}

const IMAGE_MAX = 10 * 1024 * 1024  // 10 MB
const VIDEO_MAX =  5 * 1024 * 1024  //  5 MB

export function CoverImage({ initialCoverUrl, initialCoverVideoUrl, isOwn }: Props) {
  const [coverUrl,      setCoverUrl]      = useState(initialCoverUrl)
  const [coverVideoUrl, setCoverVideoUrl] = useState(initialCoverVideoUrl)
  const [uploading,     setUploading]     = useState(false)
  const [dragOver,      setDragOver]      = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    const isVideo = file.type.startsWith("video/")
    setError(null)

    if (isVideo && file.size > VIDEO_MAX) {
      setError("Video must be under 5 MB — compress it first")
      return
    }
    if (!isVideo && file.size > IMAGE_MAX) {
      setError("Image must be under 10 MB")
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)

      const endpoint = isVideo ? "/api/users/upload-cover-video" : "/api/users/upload-cover"
      const res = await fetch(endpoint, { method: "POST", body: form })
      const data = await res.json() as { coverUrl?: string; error?: string }

      if (!data.coverUrl) {
        setError(data.error ?? "Upload failed")
        return
      }

      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isVideo ? { coverVideoUrl: data.coverUrl } : { coverImageUrl: data.coverUrl }),
      })

      if (isVideo) {
        setCoverVideoUrl(data.coverUrl)
        setCoverUrl(null)
      } else {
        setCoverUrl(data.coverUrl)
        setCoverVideoUrl(null)
      }
    } catch {
      setError("Upload failed — try again")
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) upload(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  async function removeCover() {
    setError(null)
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImageUrl: null, coverVideoUrl: null }),
    })
    setCoverUrl(null)
    setCoverVideoUrl(null)
  }

  const hasCover = !!(coverVideoUrl || coverUrl)

  return (
    <div className="relative w-full h-[200px] bg-mist-grey">

      {/* Cover media */}
      <div className="absolute inset-0 overflow-hidden">
        {coverVideoUrl ? (
          <video
            src={coverVideoUrl}
            autoPlay loop muted playsInline
            // @ts-expect-error — fetchpriority not yet in React types
            fetchpriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : coverUrl ? (
          <Image src={coverUrl} alt="Cover" fill sizes="100vw" className="object-cover" />
        ) : null}
      </div>

      {/* Owner: drag-and-drop overlay */}
      {isOwn && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={onFileChange}
            className="hidden"
          />

          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200
              ${dragOver
                ? "bg-black/60 ring-2 ring-inset ring-white/60"
                : hasCover
                  ? "bg-black/0 hover:bg-black/30"
                  : "bg-black/10 hover:bg-black/20"
              }`}
          >
            {uploading ? (
              <Loader2 size={22} className="text-white animate-spin" />
            ) : dragOver ? (
              <>
                <Upload size={22} className="text-white" />
                <p className="font-sans text-sm font-medium text-white">Drop to upload</p>
              </>
            ) : (
              <div className={`flex flex-col items-center gap-1 rounded-xl border border-white/30 bg-black/40 px-4 py-2.5 backdrop-blur transition-opacity
                ${hasCover ? "opacity-0 hover:opacity-100 group-hover:opacity-100" : "opacity-100"}`}>
                <div className="flex items-center gap-2">
                  <Upload size={12} className="text-white" />
                  <span className="font-sans text-xs font-medium text-white">
                    {hasCover ? "Drag or click to change cover" : "Drag or click to add cover"}
                  </span>
                </div>
                <p className="font-sans text-[10px] text-white/50">Photo or MP4 · Max 5 MB</p>
              </div>
            )}
          </div>

          {/* Remove button */}
          {hasCover && !uploading && (
            <button
              onClick={e => { e.stopPropagation(); removeCover() }}
              className="absolute top-3 right-3 z-20 flex items-center justify-center h-7 w-7 rounded-full border border-white/30 bg-black/50 text-white backdrop-blur hover:bg-black/70 transition-colors"
              title="Remove cover"
            >
              <X size={13} />
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-lg bg-black/80 px-4 py-2 backdrop-blur">
              <p className="font-sans text-xs text-red-400 whitespace-nowrap">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
