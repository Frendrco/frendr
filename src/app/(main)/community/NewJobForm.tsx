"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const JOB_TYPES = ["full-time", "part-time", "contract", "freelance", "internship"]

export function NewJobForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [applyEmail, setApplyEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !company.trim() || !type || !description.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, company, location, type, description, applyEmail }),
    })

    if (!res.ok) {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
      return
    }

    router.push("/community/jobs")
  }

  const field = "w-full h-11 rounded-xl border border-border bg-background px-4 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Job Title</label>
          <input className={field} placeholder="Senior Motion Designer" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Company</label>
          <input className={field} placeholder="Acme Studio" value={company} onChange={e => setCompany(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Location</label>
          <input className={field} placeholder="Remote, New York, etc." value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Type</label>
          <select
            className={cn(field, "cursor-pointer")}
            value={type}
            onChange={e => setType(e.target.value)}
            required
          >
            <option value="" disabled>Select type…</option>
            {JOB_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Description</label>
        <textarea
          rows={8}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
          placeholder="Describe the role, responsibilities, and requirements…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Apply Email</label>
        <input className={field} type="email" placeholder="hiring@studio.com" value={applyEmail} onChange={e => setApplyEmail(e.target.value)} required />
      </div>

      {error && <p className="font-sans text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || !company.trim() || !type || !description.trim() || !applyEmail.trim() || submitting}
          className="h-10 rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting…" : "Post Job"}
        </button>
      </div>
    </form>
  )
}
