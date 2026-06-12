import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { EditJobForm } from "../../../EditJobForm"

type Props = { params: Promise<{ jobId: string }> }

export default async function EditJobPage({ params }: Props) {
  const { jobId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) redirect("/sign-in")

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, company: true, location: true, type: true, description: true, applyEmail: true, userId: true },
  })
  if (!job) notFound()
  if (job.userId !== user.id) notFound()

  return (
    <div>
      <Link
        href="/community/jobs"
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Jobs
      </Link>

      <h1 className="mb-6 font-sans font-bold text-xl text-foreground">Edit Job</h1>

      <EditJobForm
        jobId={job.id}
        initial={{
          title:       job.title,
          company:     job.company,
          location:    job.location,
          type:        job.type,
          description: job.description,
          applyEmail:  job.applyEmail,
        }}
      />
    </div>
  )
}
