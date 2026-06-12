"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-10 w-10 shrink-0" />

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center h-10 w-10 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur hover:bg-spring-green hover:border-spring-green transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark"
        ? <Sun size={15} className="text-foreground" />
        : <Moon size={15} className="text-foreground" />
      }
    </button>
  )
}
