export default function Loading() {
  return (
    <div className="container-store py-12">
      <div className="mb-10">
        <div className="h-12 w-48 rounded-lg bg-surface-container-high animate-pulse" />
        <div className="mt-3 h-5 w-96 max-w-full rounded bg-surface-container-high animate-pulse" />
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[180px]">
            <div className="mb-3 aspect-square rounded-xl bg-surface-container-high animate-pulse" />
            <div className="h-5 w-3/4 rounded bg-surface-container-high animate-pulse" />
            <div className="mt-2 h-4 w-1/4 rounded bg-surface-container-high animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
