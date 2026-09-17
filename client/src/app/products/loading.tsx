export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:flex gap-12 animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="hidden md:block w-64 flex-shrink-0 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-24 mb-8"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="flex-1">
        <div className="h-10 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-[4/5] bg-gray-200"></div>
              <div className="p-6 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
