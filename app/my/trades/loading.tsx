import { Skeleton } from "@/components/ui/skeleton";

export default function MyTradesLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Skeleton className="h-7 w-40 mb-6" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-20 rounded-lg" />
              <Skeleton className="h-5 w-5 shrink-0 mt-7" />
              <Skeleton className="flex-1 h-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
