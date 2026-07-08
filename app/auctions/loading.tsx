export default function AuctionsLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-6 w-1/2 bg-gray-100 rounded" />
              <div className="h-9 w-full bg-gray-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
