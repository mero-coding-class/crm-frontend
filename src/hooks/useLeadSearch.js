import { useState, useEffect, useMemo } from 'react';
import { searchLeads, sortLeads, paginateLeads } from '../utils/searchUtils';

export const useLeadSearch = (allLeads, pageSize = 20) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    classType: 'Class',
    shift: 'Shift',
    device: 'Device',
    subStatus: 'SubStatus',
    prevCodingExp: 'CodingExp'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', direction: 'desc' });

  // Computed filtered and sorted leads
  const filteredLeads = useMemo(() => {
    const activeFilters = {
      status: filters.status === 'All' ? '' : filters.status,
      class_type: filters.classType === 'Class' ? '' : filters.classType,
      shift: filters.shift === 'Shift' ? '' : filters.shift,
      device: filters.device === 'Device' ? '' : filters.device,
      substatus: filters.subStatus === 'SubStatus' ? '' : filters.subStatus,
      previous_coding_experience: filters.prevCodingExp === 'CodingExp' ? '' : filters.prevCodingExp,
    };

    const searchResults = searchLeads(allLeads, searchTerm, activeFilters);
    return sortLeads(searchResults, sortConfig.field, sortConfig.direction);
  }, [allLeads, searchTerm, filters, sortConfig]);

  // Computed paginated leads
  const displayedLeads = useMemo(() => {
    return paginateLeads(filteredLeads, currentPage, pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Computed total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredLeads.length / pageSize);
  }, [filteredLeads, pageSize]);

  // Reset to first page when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    filteredLeads,
    displayedLeads,
    totalPages
  };
};