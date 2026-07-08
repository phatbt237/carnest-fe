import { Skeleton } from "@/components/ui/skeleton";

export default function AuctionDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Info panel */}
        <div className="space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="rounded-xl border p-5 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="rounded-xl border p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="rounded-xl border p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
