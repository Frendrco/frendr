"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
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
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") setInstalled(true)
    setPrompt(null)
  }

  if (installed) {
    return (
      <div className="inline-flex h-11 items-center gap-2 rounded-full bg-spring-green px-8 font-sans font-medium text-sm text-core-black">
        Installed ✓
      </div>
    )
  }

  if (!prompt) return null

  return (
    <button
      onClick={handleInstall}
      className="inline-flex h-11 items-center px-8 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90"
    >
      Install Frendr
    </button>
  )
}
