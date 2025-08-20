// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Leads.jsx

import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
// import Loader from "../components/common/Loader"; // Removed Loader import
import { AuthContext } from "../App";
// If you uncomment api, ensure it's set up correctly
// import api from "../services/api";

// Import components
import LeadTableDisplay from "../components/LeadTableDisplay";
import LeadEditModal from "../components/LeadEditModal";
import AddLeadModal from "../components/AddLeadModal";
import mockLeads from "../data/mockLeads"; // Using mock data

import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

// Mock API service for demonstration purposes
const leadService = {
  getLeads: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { default: mockData } = await import("../data/mockLeads");
    return mockData;
  },
  updateLead: async (id, updates) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`Simulating update for lead ${id} with:`, updates);
    return { success: true, message: "Lead updated successfully" };
  },
  // Note: deleteLead is not used directly here, it's for permanent deletion in TrashPage
};

const Leads = () => {
  const { authToken } = useContext(AuthContext);

  // Initialize allLeads directly with mock data to avoid initial empty state and loading spinner
  const initialLeads = useMemo(() => {
    return mockLeads.map((lead) => ({ ...lead, changeLog: lead.changeLog || [] }));
  }, []);

  const [allLeads, setAllLeads] = useState(initialLeads); // Holds all leads, active and trashed
  // const [loading, setLoading] = useState(true); // Removed loading state
  const [error, setError] = useState(null);

  // States for managing the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // State for managing the add lead modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Active"); // Default to "Status" (which acts as "All")

  // New filter states - Initial values changed as per request
  const [filterAgeGrade, setFilterAgeGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("Class"); // Changed default
  const [filterShift, setFilterShift] = useState("Shift");       // Changed default
  const [filterDevice, setFilterDevice] = useState("Device");     // Changed default
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("CodingExp"); // Changed default

  // State to control visibility of the filter section
  const [showFilters, setShowFilters] = useState(false);

  // Define status options - NOW INCLUDING "Closed", "Lost", "Junk" for selection
  const statusOptions = [
    "Status", // This will now act as "All" for the Leads page
    "New",
    "Open",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Active",
    "Qualified", // Added 'Qualified' status
    "Closed",
    "Converted",
    "Lost",
    "Junk",
  ];

  // Define new filter options arrays with updated "All" placeholders
  const classTypeOptions = ["Class", "Online", "Physical"]; // Changed "All" to "Class"
  const shiftOptions = [
    "Shift", // Changed "All" to "Shift"
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
    "Device", // Changed "All" to "Device"
    "Yes",
    "No",
    "N/A",
    "Laptop",
    "PC",
    "Tablet",
    "Mobile",
    "Other",
  ];
  const previousCodingExpOptions = [
    "CodingExp", // Changed "All" to "CodingExp"
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
    async (newLeadData) => {
      // In a real app, you'd send this to your backend
      console.log("Adding new lead:", newLeadData);
      // Simulate API call for adding lead (no actual backend call here)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newLeadWithId = {
        ...newLeadData,
        _id: Date.now().toString(), // Simple unique ID for mock data
        changeLog: [`Lead created at ${new Date().toLocaleString()}`], // Initial log
      };
      setAllLeads((prevLeads) => [...prevLeads, newLeadWithId]);
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
    async (updatedLead) => {
      console.log("Saving edited lead from modal:", updatedLead);
      // Simulate API call for saving edit
      await leadService.updateLead(updatedLead._id, updatedLead);

      setAllLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        )
      );
      handleCloseEditModal();
    },
    [handleCloseEditModal]
  );

  // --- Functions to handle direct inline changes from LeadTableDisplay ---
  const updateLeadField = useCallback(async (leadId, fieldName, newValue) => {
    setAllLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (lead._id === leadId) {
          const updatedLead = { ...lead, [fieldName]: newValue };
          let logEntry = "";
          const currentDateTime = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          // Add to change log if status, remarks, or call dates change
          if (fieldName === "status" && lead.status !== newValue) {
            logEntry = `Status changed from '${lead.status}' to '${newValue}'.`;
            updatedLead.changeLog = [
              ...(updatedLead.changeLog || []),
              `${logEntry} (at ${currentDateTime})`,
            ];
          } else if (fieldName === "remarks" && lead.remarks !== newValue) {
            logEntry = `Remarks updated.`;
            updatedLead.changeLog = [
              ...(updatedLead.changeLog || []),
              `${logEntry} (at ${currentDateTime})`,
            ];
          } else if (
            fieldName === "recentCall" &&
            lead.recentCall !== newValue
          ) {
            logEntry = `Last Call date changed from '${lead.recentCall}' to '${newValue}'.`;
            updatedLead.changeLog = [
              ...(updatedLead.changeLog || []),
              `${logEntry} (at ${currentDateTime})`,
            ];
          } else if (fieldName === "nextCall" && lead.nextCall !== newValue) {
            logEntry = `Next Call date changed from '${lead.nextCall}' to '${newValue}'.`;
            updatedLead.changeLog = [
              ...(updatedLead.changeLog || []),
              `${logEntry} (at ${currentDateTime})`,
            ];
          } else if (fieldName === "device" && lead.device !== newValue) { // Corrected from 'laptop' to 'device'
            logEntry = `Device changed from '${lead.device}' to '${newValue}'.`;
            updatedLead.changeLog = [
              ...(updatedLead.changeLog || []),
              `${logEntry} (at ${currentDateTime})`,
            ];
          }

          // Send update to backend (simulated)
          leadService.updateLead(leadId, { [fieldName]: newValue, changeLog: updatedLead.changeLog })
            .catch(err => console.error(`Error updating ${fieldName} for lead ${leadId}:`, err));

          return updatedLead;
        }
        return lead;
      })
    );
    console.log(`Lead ${leadId} ${fieldName} changed to: ${newValue}`);
  }, []);

  const handleStatusChange = useCallback(
    (leadId, newStatus) => {
      updateLeadField(leadId, "status", newStatus);
    },
    [updateLeadField]
  );

  const handleRemarkChange = useCallback(
    (leadId, newRemark) => {
      updateLeadField(leadId, "remarks", newRemark);
    },
    [updateLeadField]
  );

  const handleRecentCallChange = useCallback(
    (leadId, newDate) => {
      updateLeadField(leadId, "recentCall", newDate);
    },
    [updateLeadField]
  );

  const handleNextCallChange = useCallback(
    (leadId, newDate) => {
      updateLeadField(leadId, "nextCall", newDate);
    },
    [updateLeadField]
  );
  // --- End of new functions ---

  // Placeholder functions for buttons, updated to use console.log
  const handleImport = useCallback(() => {
    console.log("Import CSV functionality not yet implemented.");
  }, []);

  const handleExport = useCallback(() => {
    console.log("Export CSV functionality not yet implemented.");
  }, []);

  const handleRefresh = useCallback(() => {
    setError(null);
    leadService.getLeads()
      .then(data => setAllLeads(data.map(lead => ({ ...lead, changeLog: lead.changeLog || [] }))))
      .catch(err => {
        setError("Failed to refresh leads.");
        console.error("Error refreshing leads:", err);
      });
  }, []);

  // This handleDelete now explicitly moves the lead to "Junk" status (archives it)
  const handleDelete = useCallback(async (leadId) => {
    if (window.confirm("Are you sure you want to move this lead to trash?")) {
      try {
        const originalLead = allLeads.find((lead) => lead._id === leadId);
        const updatedLog = originalLead.changeLog
          ? [...originalLead.changeLog]
          : [];
        const timestamp = new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        updatedLog.push(`Moved to Trash by User at ${timestamp}`);

        await leadService.updateLead(leadId, { status: "Junk", changeLog: updatedLog }); // Set status to Junk
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, status: "Junk", changeLog: updatedLog } : lead
          )
        );
      } catch (err) {
        setError("Failed to move lead to trash.");
        console.error("Error moving lead to trash:", err);
      }
    }
  }, [allLeads]); // Depend on allLeads to get the original lead for logging


  // Filtering and Searching Logic for Leads page
  const displayedLeads = useMemo(() => {
    let currentLeads = allLeads; // Start with all leads

    // Apply status filter first
    // If filterStatus is "Status", it means "All" statuses are desired, so no filtering by status yet.
    if (filterStatus && filterStatus !== "Status") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }

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
      currentLeads = currentLeads.filter(
        (lead) => lead.recentCall && lead.recentCall === filterLastCall
      );
    }

    // Apply Class Type filter - Adjusted to use "Class" as the "All" equivalent
    if (filterClassType && filterClassType !== "Class") {
      currentLeads = currentLeads.filter(
        (lead) => lead.classType === filterClassType
      );
    }

    // Apply Shift filter - Adjusted to use "Shift" as the "All" equivalent
    if (filterShift && filterShift !== "Shift") {
      currentLeads = currentLeads.filter((lead) => lead.shift === filterShift);
    }

    // Apply Device filter - Adjusted to use "Device" as the "All" equivalent
    if (filterDevice && filterDevice !== "Device") {
      currentLeads = currentLeads.filter(
        (lead) => lead.device === filterDevice
      );
    }

    // Apply Previous Coding Experience filter - Adjusted to use "CodingExp" as the "All" equivalent
    if (filterPrevCodingExp && filterPrevCodingExp !== "CodingExp") {
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

  // The useEffect for initial data fetching is modified to directly use mockLeads
  // and only handle potential errors from the mock service if it were to reject.
  // The primary data loading is now synchronous via useState initialization.
  useEffect(() => {
    // This useEffect is now primarily for potential async operations if you switch
    // to a real API, or for effects that depend on authToken changing.
    // For now, it's just a placeholder to show the dependency.
    if (authToken) {
      console.log("Auth token changed, re-evaluating leads (mock data).");
    }
  }, [authToken]);


  if (error) {
    return (
      <div className="text-red-500 text-center p-4">Error: {error}</div>
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
              type="date"
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
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <LeadTableDisplay
            leads={displayedLeads} // Changed from activeLeads to displayedLeads
            handleEdit={handleEdit}
            handleDelete={handleDelete} // This now archives the lead
            onStatusChange={handleStatusChange}
            onRemarkChange={handleRemarkChange}
            onRecentCallChange={handleRecentCallChange}
            onNextCallChange={handleNextCallChange}
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
