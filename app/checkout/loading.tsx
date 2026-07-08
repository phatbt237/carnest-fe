import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Skeleton className="h-7 w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 space-y-3 h-fit">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
