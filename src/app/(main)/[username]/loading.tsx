export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Cover */}
      <div className="h-48 w-full bg-mist-grey animate-pulse md:h-64" />

      {/* Profile header */}
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 py-8 md:flex-row md:items-end md:gap-6">
          <div className="-mt-16 h-28 w-28 shrink-0 rounded-full bg-mist-grey animate-pulse ring-4 ring-white" />
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="h-5 w-40 rounded-full bg-mist-grey animate-pulse" />
            <div className="h-3.5 w-24 rounded-full bg-mist-grey animate-pulse" />
            <div className="h-3 w-56 rounded-full bg-mist-grey animate-pulse" />
          </div>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-2 gap-4 pb-24 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-video rounded-xl bg-mist-grey animate-pulse" />
              <div className="h-3 w-3/4 rounded-full bg-mist-grey animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
