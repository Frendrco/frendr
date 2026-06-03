export default function Loading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-[200px] w-full bg-foreground/8" />
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 pb-10">
        <div className="-mt-9 mb-4 flex">
          <div className="h-[72px] w-[72px] rounded-full bg-foreground/8 ring-4 ring-white" />
        </div>
        <div className="flex flex-col gap-10 md:flex-row md:gap-12">
          <div className="shrink-0 md:w-52 lg:w-56 flex flex-col gap-2">
            <div className="h-5 w-32 rounded-lg bg-foreground/8" />
            <div className="h-3 w-24 rounded-lg bg-foreground/8" />
            <div className="h-3 w-20 rounded-lg bg-foreground/8 mt-2" />
            <div className="h-3 w-20 rounded-lg bg-foreground/8" />
            <div className="h-9 rounded-full bg-foreground/8 mt-4" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 h-fit">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-video rounded-xl bg-foreground/8 mb-2" />
                <div className="h-3 w-3/4 rounded-full bg-foreground/8" />
                <div className="h-2.5 w-1/3 rounded-full bg-foreground/8 mt-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
