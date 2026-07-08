export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-carnest-surface animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-carnest-navy py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl space-y-4">
          <div className="h-4 w-48 bg-white/10 rounded-full" />
          <div className="h-10 w-3/4 bg-white/10 rounded" />
          <div className="h-10 w-1/2 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/8 rounded mt-4" />
          <div className="h-4 w-5/6 bg-white/8 rounded" />
          <div className="flex gap-3 mt-6">
            <div className="h-11 w-36 bg-white/15 rounded-xl" />
            <div className="h-11 w-36 bg-white/8 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Features strip */}
      <div className="bg-white border-b border-gray-100 py-10">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products grid skeleton */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="h-8 w-40 bg-gray-200 rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-5 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
