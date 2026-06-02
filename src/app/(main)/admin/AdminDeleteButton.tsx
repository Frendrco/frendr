"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Props {
  endpoint: string
  label: string
  redirectTo?: string
}

export function AdminDeleteButton({ endpoint, label, redirectTo }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint, { method: "DELETE" })
      if (res.ok) {
        setOpen(false)
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Delete"
      >
        <Trash2 size={13} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-core-black">Delete {label}?</DialogTitle>
            <DialogDescription className="font-sans text-sm text-foreground/60">
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-full border border-border px-5 font-sans text-sm text-foreground/70 hover:border-foreground/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="h-9 rounded-full bg-red-500 px-5 font-sans font-medium text-sm text-white disabled:opacity-50 flex items-center gap-2 transition-opacity"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
