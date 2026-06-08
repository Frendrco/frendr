"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true)
      return
    }
    function onPrompt(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setPrompt(null)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (prompt) {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === "accepted") setInstalled(true)
      setPrompt(null)
    } else {
      setShowManual(true)
      document.getElementById("how-to-install")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (installed) {
    return (
      <div className="inline-flex h-11 items-center gap-2 rounded-full bg-spring-green px-8 font-sans font-medium text-sm text-core-black">
        Already installed ✓
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleInstall}
        className="inline-flex h-11 items-center px-8 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-transform hover:scale-105"
      >
        Install Frendr
      </button>
      {showManual && (
        <p className="font-sans text-xs text-foreground/50 max-w-xs text-center">
          Your browser didn&apos;t show an install prompt — use the steps below to install manually.
        </p>
      )}
    </div>
  )
}
