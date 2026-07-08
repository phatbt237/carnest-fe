export default function OrdersLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl animate-pulse">
      <div className="h-7 w-32 bg-gray-200 rounded mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="flex gap-3">
              <div className="h-14 w-14 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-20 bg-gray-200 rounded shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
