export default function ShopDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Banner */}
      <div className="h-40 md:h-52 bg-gray-200" />

      <div className="container mx-auto px-4 py-6">
        {/* Shop header */}
        <div className="flex items-end gap-4 -mt-12 mb-8">
          <div className="h-20 w-20 rounded-full bg-gray-200 border-4 border-white shrink-0" />
          <div className="space-y-2 pb-2">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
  );
}
