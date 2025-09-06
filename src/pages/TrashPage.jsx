// src/pages/TrashPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import TrashTableDisplay from "../components/TrashDisplayTable.jsx"; // Note: The file name in your prompt was "TrashDisplayTable.jsx", but I'm using "TrashTableDisplay.jsx" to match the component name you provided. Please ensure the import path is correct.
import LeadEditModal from "../components/LeadEditModal.jsx";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { trashService, leadService } from "../services/api.js";

const TrashPage = () => {
  const { authToken, currentUser } = useAuth();
  const [allLeads, setAllLeads] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAge, setFilterAge] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("All");
  const [filterShift, setFilterShift] = useState("All");
  const [filterDevice, setFilterDevice] = useState("All");
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = ["All", "Lost", "Junk"];
  const classTypeOptions = ["All", "Online", "Physical", "Class"];
  const shiftOptions = [
    "All",
    "7 A.M. - 9 A.M.",
    "8 A.M. - 10 A.M.",
    "10 A.M. - 12 P.M.",
    "11 A.M. - 1 P.M.",
    "12 P.M. - 2 P.M.",
    "2 P.M. - 4 P.M.",
    "2:30 P.M. - 4:30 P.M.",
    "4 P.M. - 6 P.M.",
    "4:30 P.M. - 6:30 P.M.",
    "5 P.M. - 7 P.M.",
    "6 P.M. - 7 P.M.",
    "6 P.M. - 8 P.M.",
    "7 P.M. - 8 P.M.",
  ];
  const deviceOptions = ["All", "Yes", "No"];
  const previousCodingExpOptions = [
    "All",
    "None",
    "Basic Python",
    "Intermediate C++",
    "Arduino",
    "Some Linux",
    "Advanced Python",
    "Basic Java",
    "Other",
  ];

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trashService.getTrashedLeads(authToken);
      setAllLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads from trash:", err);
      setError(
        err.message || "Failed to load trashed leads. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      fetchLeads();
    }
  }, [authToken, fetchLeads]);

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
      const backendUpdates = {
        student_name: updatedLead.studentName,
        parents_name: updatedLead.parentsName,
        email: updatedLead.email,
        phone_number: updatedLead.phone,
        whatsapp_number: updatedLead.contactWhatsapp,
        age: updatedLead.age,
        grade: updatedLead.grade,
        course: updatedLead.course,
        source: updatedLead.source,
        last_call: updatedLead.recentCall,
        next_call: updatedLead.nextCall,
        status: updatedLead.status,
        address_line_1: updatedLead.permanentAddress,
        address_line_2: updatedLead.temporaryAddress,
        city: updatedLead.city,
        county: updatedLead.county,
        post_code: updatedLead.postCode,
        class_type: updatedLead.classType,
        value: updatedLead.value,
        adset_name: updatedLead.adsetName,
        remarks: updatedLead.remarks,
        shift: updatedLead.shift,
        payment_type: updatedLead.paymentType,
        device: updatedLead.device,
        previous_coding_experience: updatedLead.previousCodingExp,
        workshop_batch: updatedLead.workshopBatch,
        add_date: updatedLead.addDate,
        change_log: updatedLead.changeLog,
      };

      try {
        await leadService.updateLead(updatedLead.id, backendUpdates, authToken);
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === updatedLead.id ? { ...updatedLead, id: lead.id } : lead
          )
        );
        handleCloseEditModal();
      } catch (err) {
        setError("Failed to save changes to lead.");
        console.error("Error saving edited lead:", err);
      }
    },
    [authToken, handleCloseEditModal]
  );

  const handlePermanentDeleteLead = useCallback(
    async (id) => {
      if (
        window.confirm(
          "Are you sure you want to permanently delete this lead? This action cannot be undone."
        )
      ) {
        try {
          await trashService.deleteTrashedLead(id, authToken);
          setAllLeads((prevLeads) =>
            prevLeads.filter((lead) => lead.id !== id)
          );
        } catch (err) {
          setError("Failed to permanently delete lead.");
          console.error("Error permanently deleting lead:", err);
        }
      }
    },
    [authToken]
  );

  const handleRestoreLead = useCallback(
    async (id) => {
      if (
        window.confirm(
          "Are you sure you want to restore this lead? It will be moved back to active leads."
        )
      ) {
        try {
          const originalLead = allLeads.find((lead) => lead.id === id);
          if (!originalLead) return;

          const newLogEntry = {
            timestamp: new Date().toISOString(),
            updaterName: currentUser?.username || "Unknown User",
            updaterRole: currentUser?.role || "Guest",
            message: `Restored from Trash.`,
          };

          const updatedChangeLog = originalLead.changeLog
            ? [...originalLead.changeLog, newLogEntry]
            : [newLogEntry];

          await leadService.updateLead(
            id,
            { status: "New", changeLog: updatedChangeLog },
            authToken
          );

          setAllLeads((prevLeads) =>
            prevLeads.filter((lead) => lead.id !== id)
          );
        } catch (err) {
          setError("Failed to restore lead.");
          console.error("Error restoring lead:", err);
        }
      }
    },
    [allLeads, authToken, currentUser]
  );

  // --- NEW LOGIC FOR BULK ACTIONS ---

  const handleBulkRestoreLeads = useCallback(
    async (leadIds) => {
      setError(null);
      const restoredIds = new Set();
      const newLogs = {
        timestamp: new Date().toISOString(),
        updaterName: currentUser?.username || "Unknown User",
        updaterRole: currentUser?.role || "Guest",
        message: "Restored from Trash (Bulk Action).",
      };

      try {
        await Promise.all(
          leadIds.map(async (id) => {
            const originalLead = allLeads.find((lead) => lead.id === id);
            if (!originalLead) return;

            const updatedChangeLog = originalLead.changeLog
              ? [...originalLead.changeLog, newLogs]
              : [newLogs];

            await leadService.updateLead(
              id,
              { status: "New", changeLog: updatedChangeLog },
              authToken
            );
            restoredIds.add(id);
          })
        );
        // Optimistically update the UI to remove restored leads
        setAllLeads((prevLeads) =>
          prevLeads.filter((lead) => !restoredIds.has(lead.id))
        );
      } catch (err) {
        console.error("Error during bulk restore:", err);
        setError("Failed to restore some or all leads.");
        // A full refresh is a good fallback for partial failures
        fetchLeads();
      }
    },
    [authToken, currentUser, allLeads, fetchLeads]
  );

  const handleBulkPermanentDeleteLeads = useCallback(
    async (leadIds) => {
      setError(null);
      const deletedIds = new Set();
      try {
        await Promise.all(
          leadIds.map(async (id) => {
            await trashService.deleteTrashedLead(id, authToken);
            deletedIds.add(id);
          })
        );
        // Optimistically update the UI to remove deleted leads
        setAllLeads((prevLeads) =>
          prevLeads.filter((lead) => !deletedIds.has(lead.id))
        );
      } catch (err) {
        console.error("Error during bulk permanent delete:", err);
        setError("Failed to permanently delete some or all leads.");
        // A full refresh is a good fallback for partial failures
        fetchLeads();
      }
    },
    [authToken, fetchLeads]
  );

  const updateLeadField = useCallback(
    async (leadId, fieldName, newValue) => {
      const leadToUpdate = allLeads.find((lead) => lead.id === leadId);
      if (!leadToUpdate) return;

      const currentTimestamp = new Date().toISOString();
      let message = "";
      let fieldKey = fieldName;

      switch (fieldName) {
        case "status":
          if (leadToUpdate.status !== newValue) {
            message = `Status changed from '${leadToUpdate.status}' to '${newValue}'.`;
          }
          break;
        case "remarks":
          if (leadToUpdate.remarks !== newValue) {
            message = `Remarks updated.`;
          }
          break;
        case "recentCall":
          fieldKey = "last_call";
          if (leadToUpdate.last_call !== newValue) {
            message = `Last Call date changed from '${
              leadToUpdate.last_call || "N/A"
            }' to '${newValue || "N/A"}'.`;
          }
          break;
        case "nextCall":
          fieldKey = "next_call";
          if (leadToUpdate.next_call !== newValue) {
            message = `Next Call date changed from '${
              leadToUpdate.next_call || "N/A"
            }' to '${newValue || "N/A"}'.`;
          }
          break;
        case "device":
          if (leadToUpdate.device !== newValue) {
            message = `Device changed from '${
              leadToUpdate.device || "N/A"
            }' to '${newValue || "N/A"}'.`;
          }
          break;
        case "age":
          if (leadToUpdate.age !== newValue) {
            message = `Age changed from '${leadToUpdate.age || "N/A"}' to '${
              newValue || "N/A"
            }'.`;
          }
          break;
        case "grade":
          if (leadToUpdate.grade !== newValue) {
            message = `Grade changed from '${
              leadToUpdate.grade || "N/A"
            }' to '${newValue || "N/A"}'.`;
          }
          break;
        default:
          if (leadToUpdate[fieldName] !== newValue) {
            message = `${fieldName} updated.`;
          }
          break;
      }

      const newLogEntry = message
        ? {
            timestamp: currentTimestamp,
            updaterName: currentUser?.username || "Unknown User",
            updaterRole: currentUser?.role || "Guest",
            message: message,
          }
        : null;

      const updatedChangeLog = newLogEntry
        ? [...(leadToUpdate.changeLog || []), newLogEntry]
        : leadToUpdate.changeLog;

      const updatesPayload = { [fieldKey]: newValue };
      if (newLogEntry) {
        updatesPayload.changeLog = updatedChangeLog;
      }

      try {
        await leadService.updateLead(leadId, updatesPayload, authToken);
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === leadId
              ? { ...lead, [fieldName]: newValue, changeLog: updatedChangeLog }
              : lead
          )
        );
      } catch (err) {
        console.error(`Error updating ${fieldName} for lead ${leadId}:`, err);
        setError(`Failed to update ${fieldName}.`);
      }
    },
    [allLeads, authToken, currentUser]
  );

  const handleRefresh = useCallback(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredTrashedLeads = useMemo(() => {
    let currentLeads = allLeads;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentLeads = currentLeads.filter(
        (lead) =>
          (lead.student_name &&
            lead.student_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.email &&
            lead.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.phone_number &&
            lead.phone_number.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    if (filterStatus && filterStatus !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }
    if (filterAge) {
      currentLeads = currentLeads.filter(
        (lead) => lead.age && lead.age.toString().includes(filterAge)
      );
    }
    if (filterGrade) {
      currentLeads = currentLeads.filter(
        (lead) => lead.grade && lead.grade.toString().includes(filterGrade)
      );
    }
    if (filterLastCall) {
      currentLeads = currentLeads.filter(
        (lead) => lead.last_call && lead.last_call.startsWith(filterLastCall)
      );
    }
    if (filterClassType && filterClassType !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.class_type === filterClassType
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
        (lead) => lead.previous_coding_experience === filterPrevCodingExp
      );
    }

    return currentLeads;
  }, [
    allLeads,
    searchTerm,
    filterStatus,
    filterAge,
    filterGrade,
    filterLastCall,
    filterClassType,
    filterShift,
    filterDevice,
    filterPrevCodingExp,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-700">
          Loading trashed leads...
        </div>
      </div>
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
            onBulkRestore={handleBulkRestoreLeads} // Pass the new bulk restore function
            onBulkPermanentDelete={handleBulkPermanentDeleteLeads} // Pass the new bulk delete function
            onStatusChange={(leadId, newStatus) =>
              updateLeadField(leadId, "status", newStatus)
            }
            onRemarkChange={(leadId, newRemark) =>
              updateLeadField(leadId, "remarks", newRemark)
            }
            onRecentCallChange={(leadId, newDate) =>
              updateLeadField(leadId, "recentCall", newDate)
            }
            onNextCallChange={(leadId, newDate) =>
              updateLeadField(leadId, "nextCall", newDate)
            }
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
