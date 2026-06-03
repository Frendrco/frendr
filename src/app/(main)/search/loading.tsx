export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8">
        <div className="h-10 w-full max-w-lg rounded-full bg-foreground/8 mb-8" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-video rounded-xl bg-foreground/8 mb-2" />
              <div className="h-3 w-3/4 rounded-full bg-foreground/8" />
              <div className="h-2.5 w-1/3 rounded-full bg-foreground/8 mt-1.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
