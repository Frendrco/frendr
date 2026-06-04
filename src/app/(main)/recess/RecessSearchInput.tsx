"use client"

import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

export function RecessSearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setValue(q)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      router.push(q.trim() ? `/recess?q=${encodeURIComponent(q.trim())}` : "/recess")
    }, 300)
  }

  function clear() {
    setValue("")
    router.push("/recess")
  }

  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
      <input
        value={value}
        onChange={handleChange}
        placeholder="Search by title, creator, or tool…"
        className="h-11 w-full rounded-full border border-border bg-white pl-9 pr-9 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 transition-colors hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
