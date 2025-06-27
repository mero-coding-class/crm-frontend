// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Leads.jsx

import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Loader from "../components/common/Loader";
import { AuthContext } from "../App";
// If you uncomment api, ensure it's set up correctly
// import api from "../services/api";

// Import components
import LeadTableDisplay from "../components/LeadTableDisplay";
import LeadEditModal from "../components/LeadEditModal";
import AddLeadModal from "../components/AddLeadModal";
import mockLeads from "../data/mockLeads";

import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const Leads = () => {
  const { authToken } = useContext(AuthContext);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for managing the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // State for managing the add lead modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // Default filter status

  // New filter states
  const [filterAgeGrade, setFilterAgeGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState(""); // For "Last Call" date string
  const [filterClassType, setFilterClassType] = useState("All");
  const [filterShift, setFilterShift] = useState("All");
  const [filterDevice, setFilterDevice] = useState("All"); // For "laptop" field
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("All");

  // State to control visibility of the filter section
  const [showFilters, setShowFilters] = useState(false);

  // Define status options here, or import them if they are common.
  const statusOptions = [
    "Status",
    "New",
    "Open",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Active",
    "Closed",
    "Converted",
    "Lost",
    "Junk",
  ];

  // Define new filter options arrays from mock data to ensure consistency
  const classTypeOptions = ["Class", "Online", "Physical"];
  const shiftOptions = [
    "Shifts",
    "7 P.M. - 9 P.M.",
    "10 A.M. - 12 P.M.",
    "2 P.M. - 4 P.M.",
    "8 A.M. - 10 A.M.",
    "4 P.M. - 6 P.M.",
    "12 P.M. - 2 P.M.",
    "2:30 P.M. - 4:30 P.M.",
    "5 P.M - 7 P.M.",
    "6 P.M. - 7 P.M.",
    "7 P.M. - 8 P.M.",
  ];
  const deviceOptions = [
    "Devices",
    "Laptop",
    "PC",
    "Tablet",
    "Mobile",
    "Other",
    "N/A",
  ];
  const previousCodingExpOptions = [
    "Experience",
    "None",
    "Basic Python",
    "Intermediate C++",
    "Arduino",
    "Some Linux",
    "Advanced Python",
    "Basic Java",
  ];

  // Functions for modals (Add Lead)
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const handleAddNewLead = useCallback(
    (newLeadData) => {
      // In a real app, you'd send this to your backend
      console.log("Adding new lead:", newLeadData);
      setAllLeads((prevLeads) => [
        ...prevLeads,
        { ...newLeadData, _id: Date.now().toString() }, // Add a temporary ID
      ]);
      handleCloseAddModal();
    },
    [handleCloseAddModal]
  );

  // Functions for modals (Edit Lead)
  const handleEdit = useCallback((lead) => {
    setEditingLead(lead);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingLead(null);
  }, []);

  const handleSaveEdit = useCallback(
    (updatedLead) => {
      // In a real app, you'd send this to your backend
      console.log("Saving edited lead:", updatedLead);
      setAllLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        )
      );
      handleCloseEditModal();
    },
    [handleCloseEditModal]
  );

  // --- Functions to handle status and device changes from LeadTableDisplay ---
  const handleStatusChange = useCallback((leadId, newStatus) => {
    setAllLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead._id === leadId ? { ...lead, status: newStatus } : lead
      )
    );
    // In a real application, you would also send this update to your backend API
    console.log(`Lead ${leadId} status changed to: ${newStatus}`);
  }, []);

  const handleDeviceChange = useCallback((leadId, newDevice) => {
    setAllLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead._id === leadId ? { ...lead, laptop: newDevice } : lead
      )
    );
    // In a real application, you would also send this update to your backend API
    console.log(`Lead ${leadId} device changed to: ${newDevice}`);
  }, []);
  // --- End of new functions ---

  // Placeholder functions for buttons, updated to use console.log
  const handleImport = useCallback(() => {
    console.log("Import CSV functionality not yet implemented.");
  }, []);

  const handleExport = useCallback(() => {
    console.log("Export CSV functionality not yet implemented.");
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    // Directly use the mock data as a refresh
    setAllLeads(mockLeads);
    setLoading(false);
  }, []);

  const handleDelete = useCallback((leadId) => {
    console.log(`Confirm delete for lead with ID: ${leadId}`);
    setAllLeads((prevLeads) => prevLeads.filter((lead) => lead._id !== leadId));
  }, []);

  // Filtering and Searching Logic
  const filteredLeads = useMemo(() => {
    let currentLeads = allLeads;

    // Apply search term filter (Student Name, Email, Phone)
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentLeads = currentLeads.filter(
        (lead) =>
          (lead.studentName &&
            lead.studentName.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.email &&
            lead.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.phone && lead.phone.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Apply status filter
    if (filterStatus && filterStatus !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }

    // Apply Age/Grade filter
    if (filterAgeGrade) {
      const lowerCaseAgeGradeFilter = filterAgeGrade.toLowerCase();
      currentLeads = currentLeads.filter(
        (lead) =>
          lead.ageGrade &&
          lead.ageGrade.toLowerCase().includes(lowerCaseAgeGradeFilter)
      );
    }

    // Apply Last Call filter (date string search)
    if (filterLastCall) {
      // Assuming lead.recentCall is in a format compatible with filterLastCall (e.g., "YYYY-MM-DD")
      currentLeads = currentLeads.filter(
        (lead) => lead.recentCall && lead.recentCall === filterLastCall
      );
    }

    // Apply Class Type filter
    if (filterClassType && filterClassType !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.classType === filterClassType
      );
    }

    // Apply Shift filter
    if (filterShift && filterShift !== "All") {
      currentLeads = currentLeads.filter((lead) => lead.shift === filterShift);
    }

    // Apply Device filter (using the 'laptop' field)
    if (filterDevice && filterDevice !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.laptop === filterDevice
      );
    }

    // Apply Previous Coding Experience filter
    if (filterPrevCodingExp && filterPrevCodingExp !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.previousCodingExp === filterPrevCodingExp
      );
    }

    return currentLeads;
  }, [
    allLeads,
    searchTerm,
    filterStatus,
    filterAgeGrade,
    filterLastCall,
    filterClassType,
    filterShift,
    filterDevice,
    filterPrevCodingExp,
  ]);

  useEffect(() => {
    const fetchInitialLeads = async () => {
      setLoading(true);
      setError(null);

      setAllLeads(mockLeads);
      setLoading(false);
    };

    fetchInitialLeads();
  }, [authToken]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">Error: {error.message}</div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Leads Management</h1>

      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
            Add New Lead
          </button>
          <button
            onClick={handleImport}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-2" />
            Import CSV
          </button>
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

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FunnelIcon className="h-5 w-5 inline-block mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Conditional Filter Section */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-end mb-6 gap-3 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
          <h3 className="text-lg font-semibold mr-4">Advanced Filters:</h3>
          <div className="relative w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          {/* New Filter Controls */}
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter by Age/Grade..."
              value={filterAgeGrade}
              onChange={(e) => setFilterAgeGrade(e.target.value)}
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="date" // Changed to type="date"
              value={filterLastCall}
              onChange={(e) => setFilterLastCall(e.target.value)}
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
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
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {shiftOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
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
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <Loader />
        ) : error ? (
          <div className="text-red-500 text-center">{error.message}</div>
        ) : (
          <LeadTableDisplay
            leads={filteredLeads}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDeviceChange={handleDeviceChange}
          />
        )}
      </div>

      {/* Conditionally render the LeadEditModal */}
      {isEditModalOpen && editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}

      {/* Conditionally render the AddLeadModal as a modal */}
      {isAddModalOpen && (
        <AddLeadModal onClose={handleCloseAddModal} onSave={handleAddNewLead} />
      )}
    </div>
  );
};

export default Leads;