import React from "react";
import ImportCsvButton from "./ImportCsvButton";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const LeadsHeader = ({
  handleOpenAddModal,
  authToken,
  courses,
  handleRefresh,
  handleExport,
  handleExportAll,
  fetchingAll,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
            Add New Lead
          </button>

          <ImportCsvButton
            authToken={authToken}
            courses={courses}
            onImported={handleRefresh}
          />

          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowDownTrayIcon className="h-5 w-5 inline-block mr-2" />
            Export CSV
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowPathIcon className="h-5 w-5 inline-block mr-2" />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Email, Phone, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FunnelIcon className="h-5 w-5 inline-block mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
        {fetchingAll && (
          <div className="w-full text-sm text-center text-gray-600 mt-2">
            Fetching full dataset — this may take a moment...
          </div>
        )}
      </div>
    </>
  );
};

export default LeadsHeader;
