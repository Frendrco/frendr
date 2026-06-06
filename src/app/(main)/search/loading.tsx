export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-16 z-40 h-14 border-b border-border bg-white" />
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-video rounded-xl bg-mist-grey animate-pulse" />
              <div className="flex items-start gap-2 mt-1">
                <div className="h-6 w-6 shrink-0 rounded-full bg-mist-grey animate-pulse" />
                <div className="flex flex-col gap-1.5 flex-1 pt-0.5">
                  <div className="h-3 w-4/5 rounded-full bg-mist-grey animate-pulse" />
                  <div className="h-2.5 w-2/5 rounded-full bg-mist-grey animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
