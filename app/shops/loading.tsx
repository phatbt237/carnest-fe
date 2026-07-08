import { Skeleton } from "@/components/ui/skeleton";

export default function ShopsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-3" />
            <Skeleton className="h-5 w-32 mx-auto mb-1" />
            <Skeleton className="h-4 w-24 mx-auto mb-3" />
            <div className="flex justify-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
