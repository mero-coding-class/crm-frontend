import React, { useContext, useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "../App";
import TrashTableDisplay from "../components/TrashDisplayTable";
import LeadEditModal from "../components/LeadEditModal";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import mockLeads from "../data/mockLeads"; // Import mockLeads directly

// Mock API service for demonstration purposes
const leadService = {
  getLeads: async () => {
    // Simulate API call delay for refresh operations, but initial load is direct
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockLeads; // Return mockLeads
  },
  updateLead: async (id, updates) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`Simulating update for lead ${id} with:`, updates);
    return { success: true, message: "Lead updated successfully" };
  },
  deleteLead: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`Simulating permanent delete for lead ${id}`);
    return { success: true, message: "Lead permanently deleted" };
  },
};

const TrashPage = () => {
  const { authToken } = useContext(AuthContext);

  // Initialize allLeads directly with mock data, ensuring changeLog is present
  const initialLeads = useMemo(() => {
    return mockLeads.map((lead) => ({ ...lead, changeLog: lead.changeLog || [] }));
  }, []); // Empty dependency array means this runs once

  const [allLeads, setAllLeads] = useState(initialLeads);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [filterAgeGrade, setFilterAgeGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("All");
  const [filterShift, setFilterShift] = useState("All");
  const [filterDevice, setFilterDevice] = useState("All");
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    "All",
    "Closed",
    "Lost",
    "Junk",
  ];

  const classTypeOptions = ["Class", "Online", "Physical"];
  const shiftOptions = [
    "Shift",
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
    "CodingExp",
    "None",
    "Basic Python",
    "Intermediate C++",
    "Arduino",
    "Some Linux",
    "Advanced Python",
    "Basic Java",
  ];


  // The useEffect for initial data fetching is no longer needed here
  // as allLeads is initialized directly.
  // The handleRefresh function still uses the async mockService.getLeads().

  const handleEditLead = useCallback((lead) => {
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
      setAllLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        )
      );
      leadService.updateLead(updatedLead._id, updatedLead)
        .catch(err => console.error("Error saving edited lead to backend:", err));
      handleCloseEditModal();
    },
    [handleCloseEditModal]
  );


  const handlePermanentDeleteLead = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this lead? This action cannot be undone.")) {
      try {
        await leadService.deleteLead(id);
        setAllLeads((prevLeads) => prevLeads.filter((lead) => lead._id !== id));
      } catch (err) {
        setError("Failed to permanently delete lead.");
        console.error("Error permanently deleting lead:", err);
      }
    }
  }, []);

  const handleRestoreLead = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to restore this lead? It will be moved back to active leads.")) {
      try {
        const originalLead = allLeads.find((lead) => lead._id === id);
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
        updatedLog.push(`Restored from Trash by User at ${timestamp}`);

        await leadService.updateLead(id, { status: "New", changeLog: updatedLog });
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === id ? { ...lead, status: "New", changeLog: updatedLog } : lead
          )
        );
      } catch (err) {
        setError("Failed to restore lead.");
        console.error("Error restoring lead:", err);
      }
    }
  }, [allLeads]);


  const updateLeadField = useCallback((leadId, fieldName, newValue) => {
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
          } else if (fieldName === "device" && lead.device !== newValue) {
            logEntry = `Device changed from '${lead.device}' to '${newValue}'.`;
            updatedLead.changeLog = [
              ...(updatedLead.changeLog || []),
              `${logEntry} (at ${currentDateTime})`,
            ];
          }

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

  const handleRefresh = useCallback(() => {
    setError(null);
    leadService.getLeads()
      .then(data => setAllLeads(data.map(lead => ({ ...lead, changeLog: lead.changeLog || [] }))))
      .catch(err => {
        setError("Failed to refresh leads.");
        console.error("Error refreshing leads:", err);
      });
  }, []);


  const filteredTrashedLeads = useMemo(() => {
    let currentLeads = allLeads.filter(
      (lead) =>
        lead.status === "Junk" || lead.status === "Lost" || lead.status === "Closed"
    );

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

    if (filterStatus && filterStatus !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }

    if (filterAgeGrade) {
      const lowerCaseAgeGradeFilter = filterAgeGrade.toLowerCase();
      currentLeads = currentLeads.filter(
        (lead) =>
          lead.ageGrade &&
          lead.ageGrade.toLowerCase().includes(lowerCaseAgeGradeFilter)
      );
    }
    if (filterLastCall) {
      currentLeads = currentLeads.filter(
        (lead) => lead.recentCall && lead.recentCall === filterLastCall
      );
    }
    if (filterClassType && filterClassType !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.classType === filterClassType
      );
    }
    if (filterShift && filterShift !== "All") {
      currentLeads = currentLeads.filter((lead) => lead.shift === filterShift);
    }
    if (filterDevice && filterDevice !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.device === filterDevice
      );
    }
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


  if (error) {
    return (
      <div className="text-red-500 text-center p-4">Error: {error}</div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Trashed Leads</h1>

      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowPathIcon className="h-5 w-5 inline-block mr-2" />
            Refresh Trash
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
      </div>

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
          <TrashTableDisplay
            leads={filteredTrashedLeads}
            handleEdit={handleEditLead}
            onPermanentDelete={handlePermanentDeleteLead}
            onRestoreLead={handleRestoreLead}
            onStatusChange={handleStatusChange}
            onRemarkChange={handleRemarkChange}
            onRecentCallChange={handleRecentCallChange}
            onNextCallChange={handleNextCallChange}
          />
        )}
      </div>

      {isEditModalOpen && editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default TrashPage;
