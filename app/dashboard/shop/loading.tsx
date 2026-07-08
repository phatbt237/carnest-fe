export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="flex gap-2 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-white overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="h-[88px] w-[88px] rounded-lg bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2.5 pt-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
                <div className="flex gap-4 mt-3">
                  <div className="h-8 w-20 bg-gray-100 rounded" />
                  <div className="h-8 w-16 bg-gray-100 rounded" />
                  <div className="h-8 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            <div className="h-10 bg-gray-50 border-t" />
          </div>
        ))}
      </div>
    </div>
  );
}
