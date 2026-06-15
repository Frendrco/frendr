"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center h-10 w-10 rounded-full border border-black/10 dark:border-spring-green/40 bg-white/80 dark:bg-spring-green/15 backdrop-blur hover:bg-spring-green hover:border-spring-green transition-colors duration-200"
      aria-label="Toggle theme"
    >
      <Sun size={15} className="hidden dark:block text-foreground" />
      <Moon size={15} className="block dark:hidden text-foreground" />
    </button>
  )
}
