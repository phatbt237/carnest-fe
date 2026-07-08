import { Skeleton } from "@/components/ui/skeleton";

export default function ShowcaseDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="rounded-xl border bg-white overflow-hidden mb-6">
        <Skeleton className="aspect-[16/9] w-full" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-3/4 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
