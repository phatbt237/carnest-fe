import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-24 ml-auto rounded-full" />
      </div>
      <div className="rounded-xl border bg-white p-5 mb-4 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-5 mb-4 space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="rounded-xl border bg-white p-5 space-y-2">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
