import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Profile header */}
      <div className="rounded-xl border bg-white p-6 mb-6 flex gap-5">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-4 mt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
