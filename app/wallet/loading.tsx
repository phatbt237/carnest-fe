import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Skeleton className="h-7 w-28 mb-6" />
      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-carnest-blue/20 to-carnest-blue-light/20 p-6 mb-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      {/* Transaction list */}
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-white p-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
