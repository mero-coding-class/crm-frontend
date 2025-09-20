import React from "react";
import { FunnelIcon } from "@heroicons/react/24/outline";

const LeadsFilters = ({
  showFilters,
  filterStatus,
  setFilterStatus,
  filterAge,
  setFilterAge,
  filterGrade,
  setFilterGrade,
  filterLastCall,
  setFilterLastCall,
  filterClassType,
  setFilterClassType,
  filterShift,
  setFilterShift,
  filterDevice,
  setFilterDevice,
  filterSubStatus,
  setFilterSubStatus,
  filterPrevCodingExp,
  setFilterPrevCodingExp,
  filterAssignedTo,
  setFilterAssignedTo,
  onClearFilters,
  users,
  usersLoading,
  classTypeOptions,
  deviceOptions,
  subStatusOptions,
  previousCodingExpOptions,
}) => {
  if (!showFilters) return null;

  return (
    <div className="flex flex-wrap items-center justify-end mb-6 gap-3 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
      <h3 className="text-lg font-semibold mr-4">Advanced Filters:</h3>
      <div className="relative w-full sm:w-auto">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        >
          {["All", "Active", "Converted", "Lost"].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative w-full sm:w-auto">
        <input
          type="text"
          placeholder="Filter by Age..."
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
        />
      </div>

      <div className="relative w-full sm:w-auto">
        <input
          type="text"
          placeholder="Filter by Grade..."
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
        />
      </div>

      <div className="relative w-full sm:w-auto">
        <input
          type="date"
          value={filterLastCall}
          onChange={(e) => setFilterLastCall(e.target.value)}
          className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="relative w-full sm:w-auto">
        <select
          value={filterClassType}
          onChange={(e) => setFilterClassType(e.target.value)}
          className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        >
          {classTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative w-full sm:w-auto">
        <input
          type="text"
          placeholder="Filter by Shift..."
          value={filterShift}
          onChange={(e) => setFilterShift(e.target.value)}
          className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
        />
      </div>

      <div className="relative w-full sm:w-auto">
        <select
          value={filterDevice}
          onChange={(e) => setFilterDevice(e.target.value)}
          className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        >
          {deviceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative w-full sm:w-auto">
        <select
          value={filterSubStatus}
          onChange={(e) => setFilterSubStatus(e.target.value)}
          className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        >
          {subStatusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative w-full sm:w-auto">
        <select
          value={filterAssignedTo}
          onChange={(e) => setFilterAssignedTo(e.target.value)}
          className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        >
          <option value="">All Users</option>
          {!usersLoading &&
            Array.isArray(users) &&
            users.map((u) => (
              <option key={u.id || u.username} value={u.username || u.id}>
                {u.username || u.name || u.email || String(u.id)}
              </option>
            ))}
        </select>
      </div>

      <div className="relative w-full sm:w-auto">
        <button
          type="button"
          onClick={onClearFilters}
          className="w-full p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      <div className="relative w-full sm:w-auto">
        <select
          value={filterPrevCodingExp}
          onChange={(e) => setFilterPrevCodingExp(e.target.value)}
          className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        >
          {previousCodingExpOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default LeadsFilters;
