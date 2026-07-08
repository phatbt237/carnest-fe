import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Skeleton className="h-7 w-40 mb-6" />
      {/* Profile card */}
      <div className="rounded-2xl bg-gradient-to-br from-carnest-blue/20 to-carnest-blue-light/20 p-6 mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      {/* Menu links */}
      <div className="rounded-xl border bg-white divide-y">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 ml-auto rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
