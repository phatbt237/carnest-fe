import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Skeleton className="h-7 w-28 mb-6" />
      <div className="space-y-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 flex gap-4">
            <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-3 mt-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded shrink-0" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
