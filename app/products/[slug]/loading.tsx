export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-3 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-3 bg-gray-100 rounded" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Gallery skeleton */}
        <div className="space-y-2.5">
          <div className="aspect-[4/3] w-full rounded-xl bg-gray-200" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 w-14 rounded-lg bg-gray-200 shrink-0" />
            ))}
          </div>
        </div>

        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-gray-200 rounded-full" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-7 w-4/5 bg-gray-200 rounded" />
            <div className="h-7 w-3/5 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-40 bg-gray-100 rounded" />
          <div className="h-20 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-200 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
            <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-24 w-full bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
