export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-20 shrink-0 bg-gray-200 rounded-full" />
        ))}
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3.5 space-y-2">
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-4/5 bg-gray-200 rounded" />
              <div className="h-5 w-2/3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
