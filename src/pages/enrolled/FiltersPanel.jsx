import React from "react";

export default function FiltersPanel({
  searchQuery,
  setSearchQuery,
  searchLastPaymentDate,
  setSearchLastPaymentDate,
  filterPaymentNotCompleted,
  setFilterPaymentNotCompleted,
  filterScheduledTaken,
  setFilterScheduledTaken,
  exporting,
  onExport,
  onClear,
  loading,
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Filter Enrolled Students:</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Student Name or Email</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Payment Date</label>
          <input
            type="date"
            value={searchLastPaymentDate}
            onChange={(e) => setSearchLastPaymentDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          />
        </div>
        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            checked={filterPaymentNotCompleted}
            onChange={(e) => setFilterPaymentNotCompleted(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm font-medium text-gray-700">Payment Not Completed</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Demo Taken</label>
          <select
            value={filterScheduledTaken}
            onChange={(e) => setFilterScheduledTaken(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          >
            <option value="">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onExport}
            disabled={exporting}
            className={`px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 ${exporting ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Export CSV
          </button>
          <button
            onClick={onClear}
            disabled={loading}
            className={`ml-3 px-4 py-2 rounded-md border bg-blue-700 text-white hover:bg-blue-600 transition-opacity duration-200 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
