import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { NewJobForm } from "../../NewJobForm"

export default async function NewJobPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div>
      <Link
        href="/community/jobs"
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Jobs
      </Link>

      <div className="mb-8">
        <h2 className="font-sans font-bold text-xl text-foreground">Post a Job</h2>
        <p className="mt-1 font-sans text-sm text-foreground/50">Share a role with the animation community.</p>
      </div>

      <NewJobForm />
    </div>
  )
}
