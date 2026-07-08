import { Skeleton } from "@/components/ui/skeleton";

export default function OffersLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Skeleton className="h-7 w-40 mb-6" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 flex gap-4">
            <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
