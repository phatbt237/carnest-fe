export default function ChatLoading() {
  return (
    <div className="container mx-auto px-0 md:px-4 py-0 md:py-6 max-w-5xl">
      <div className="flex h-[calc(100vh-8rem)] md:h-[600px] md:rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm animate-pulse">
        {/* Conversations sidebar */}
        <div className="hidden md:flex w-80 flex-col border-r border-gray-100 shrink-0">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="h-5 w-24 bg-gray-200 rounded" />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message panel */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex-1" />
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex gap-2">
              <div className="h-9 w-9 bg-gray-100 rounded-md shrink-0" />
              <div className="flex-1 h-9 bg-gray-100 rounded-md" />
              <div className="h-9 w-9 bg-gray-200 rounded-md shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
