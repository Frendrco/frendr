export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <div className="flex-1 min-w-0">
            <div className="aspect-video w-full rounded-2xl bg-foreground/0 mb-4" />
            <div className="h-6 w-2/3 rounded-lg bg-foreground/0 mb-2" />
            <div className="h-4 w-1/3 rounded-lg bg-foreground/0" />
          </div>
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
            <div className="h-16 w-16 rounded-full bg-foreground/0" />
            <div className="h-4 w-32 rounded-lg bg-foreground/0" />
            <div className="h-3 w-24 rounded-lg bg-foreground/0" />
            <div className="h-9 rounded-full bg-foreground/0 mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
