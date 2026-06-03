"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

export function ShareRiveButton() {
  const router = useRouter()
  const { isSignedIn } = useUser()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [riveUrl, setRiveUrl] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const urlValid = riveUrl.trim().startsWith("https://")

  function handleClick() {
    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }
    setOpen(true)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle("")
      setRiveUrl("")
      setDescription("")
      setError(null)
    }
    setOpen(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !urlValid || submitting) return

    setSubmitting(true)
    setError(null)

    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: description.trim(),
        riveUrls: [riveUrl.trim()],
        source: "rive_world",
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Something went wrong.")
      setSubmitting(false)
      return
    }

    setTitle("")
    setRiveUrl("")
    setDescription("")
    setError(null)
    setSubmitting(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex h-10 w-fit shrink-0 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80"
      >
        Share Rive
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle className="font-sans font-bold text-lg text-core-black">
            Share your Rive
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-core-black">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your Rive a name"
                maxLength={100}
                required
                className="h-11 rounded-xl border border-border bg-white px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-core-black">
                Rive embed URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={riveUrl}
                onChange={(e) => setRiveUrl(e.target.value)}
                placeholder="https://rive.app/s/…/embed"
                required
                className="h-11 rounded-xl border border-border bg-white px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
              />
              <p className="font-sans text-[11px] text-foreground/40">
                Paste the embed URL from rive.app — e.g. https://rive.app/s/YOUR_ID/embed
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-core-black">
                Description <span className="font-normal text-foreground/40">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the community about this piece…"
                rows={3}
                className="resize-none rounded-xl border border-border bg-white px-3 py-2.5 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
              />
            </div>

            {error && (
              <p className="font-sans text-xs text-red-500">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="inline-flex h-9 items-center rounded-full border border-border px-5 font-sans text-sm font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !urlValid || submitting}
                className="inline-flex h-9 items-center rounded-full bg-spring-green px-5 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Sharing…" : "Share"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
