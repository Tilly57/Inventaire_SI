/** @fileoverview Squelette de chargement affiche pendant le chargement des pages lazy-loaded */

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-96 bg-gray-200 rounded"></div>
      </div>

      {/* Actions bar skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
        <div className="flex-1"></div>
        <div className="h-10 w-64 bg-gray-200 rounded"></div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow">
        {/* Table header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex gap-4">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-b border-gray-100 p-4">
            <div className="flex gap-4 items-center">
              <div className="h-4 w-32 bg-gray-100 rounded"></div>
              <div className="h-4 w-48 bg-gray-100 rounded"></div>
              <div className="h-4 w-40 bg-gray-100 rounded"></div>
              <div className="h-4 w-24 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="mt-6 flex justify-between items-center">
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
