import React from 'react';

export const SearchAndFilterBar = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  statusOptions,
  classTypeOptions,
  shiftOptions,
  deviceOptions,
  subStatusOptions,
  codingExpOptions
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4 space-y-4">
      {/* Search Input */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        {/* Class Type Filter */}
        <select
          value={filters.classType}
          onChange={(e) => onFilterChange('classType', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {classTypeOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        {/* Shift Filter */}
        <select
          value={filters.shift}
          onChange={(e) => onFilterChange('shift', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {shiftOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        {/* Device Filter */}
        <select
          value={filters.device}
          onChange={(e) => onFilterChange('device', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {deviceOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        {/* Sub Status Filter */}
        <select
          value={filters.subStatus}
          onChange={(e) => onFilterChange('subStatus', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {subStatusOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        {/* Previous Coding Experience Filter */}
        <select
          value={filters.prevCodingExp}
          onChange={(e) => onFilterChange('prevCodingExp', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {codingExpOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    </div>
  );
};