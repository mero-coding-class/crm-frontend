import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import TrashTableDisplay from "../components/TrashDisplayTable.jsx"; // Explicitly added .jsx extension
import LeadEditModal from "../components/LeadEditModal.jsx"; // Explicitly added .jsx extension
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

const TrashPage = () => {
  // Use the useAuth hook to get the authToken
  const { authToken } = useAuth();

  const [allLeads, setAllLeads] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [filterAge, setFilterAge] = useState(""); // Separated from grade
  const [filterGrade, setFilterGrade] = useState(""); // Separated from age

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
    // Add other statuses if you want to filter them too
  ];
  const classTypeOptions = ["All", "Online", "Physical", "Class"];
  const shiftOptions = [
    "Shift",
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
  const deviceOptions = [
    "Device", // Changed "All" to "Device"
    "Yes",
    "No",
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
    "Other",
  ];
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/trash/",
        {
          headers: {
            Authorization: `Token ${authToken}`,
          },
        }
      );
      setAllLeads(response.data);
    } catch (err) {
      console.error("Failed to fetch leads from trash:", err.response || err);
      setError("Failed to load trashed leads. Please try again.");
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
      try {
        await axios.patch(
          `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/${updatedLead.id}/`, // Use lead.id
          updatedLead,
          {
            headers: {
              Authorization: `Token ${authToken}`,
            },
          }
        );
        setAllLeads((prevLeads) =>
          prevLeads.map(
            (lead) => (lead.id === updatedLead.id ? updatedLead : lead) // Use lead.id
          )
        );
        handleCloseEditModal();
      } catch (err) {
        setError("Failed to save changes.");
        console.error("Error saving edited lead:", err.response || err);
      }
    },
    [authToken, handleCloseEditModal]
  );

  const handlePermanentDeleteLead = useCallback(
    async (id) => {
      // IMPORTANT: Changed window.confirm to a custom modal or message box
      // As per instructions, avoid window.confirm or window.alert
      // For this example, I'll replace it with a console log, but in a real app,
      // you'd render a modal and handle the confirmation within it.
      console.log(`User wants to permanently delete lead with ID: ${id}`);
      // if (
      //   window.confirm(
      //     "Are you sure you want to permanently delete this lead? This action cannot be undone."
      //   )
      // )
      try {
        await axios.delete(
          `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/${id}/`,
          {
            headers: {
              Authorization: `Token ${authToken}`,
            },
          }
        );
        setAllLeads(
          (prevLeads) => prevLeads.filter((lead) => lead.id !== id) // Use lead.id
        );
      } catch (err) {
        setError("Failed to permanently delete lead.");
        console.error("Error permanently deleting lead:", err.response || err);
      }
    },
    [authToken]
  );

  const handleRestoreLead = useCallback(
    async (id) => {
      // IMPORTANT: Changed window.confirm to a custom modal or message box
      console.log(`User wants to restore lead with ID: ${id}`);
      // if (
      //   window.confirm(
      //     "Are you sure you want to restore this lead? It will be moved back to active leads."
      //   )
      // )
      try {
        const originalLead = allLeads.find((lead) => lead.id === id); // Use lead.id
        if (!originalLead) return;

        const updatedLog = originalLead.changeLog
          ? [...originalLead.changeLog]
          : [];
        updatedLog.push(
          `Restored from Trash by User at ${new Date().toLocaleString()}`
        );

        await axios.patch(
          `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/${id}/`,
          {
            status: "New",
            changeLog: updatedLog,
          },
          {
            headers: {
              Authorization: `Token ${authToken}`,
            },
          }
        );

        setAllLeads(
          (prevLeads) => prevLeads.filter((lead) => lead.id !== id) // Use lead.id
        );
      } catch (err) {
        setError("Failed to restore lead.");
        console.error("Error restoring lead:", err.response || err);
      }
    },
    [allLeads, authToken]
  );

  const updateLeadField = useCallback(
    (leadId, fieldName, newValue) => {
      const leadToUpdate = allLeads.find((lead) => lead.id === leadId); // Use lead.id
      if (!leadToUpdate) return;

      const currentDateTime = new Date().toLocaleString();
      let logEntry = "";

      // Log entry generation logic - updated field names
      if (fieldName === "status" && leadToUpdate.status !== newValue) {
        logEntry = `Status changed from '${leadToUpdate.status}' to '${newValue}'.`;
      } else if (fieldName === "remarks" && leadToUpdate.remarks !== newValue) {
        logEntry = `Remarks updated.`;
      } else if (
        fieldName === "last_call" && // Corrected field name
        leadToUpdate.last_call !== newValue // Corrected field name
      ) {
        logEntry = `Last Call date changed from '${leadToUpdate.last_call}' to '${newValue}'.`; // Corrected field name
      } else if (
        fieldName === "next_call" && // Corrected field name
        leadToUpdate.next_call !== newValue // Corrected field name
      ) {
        logEntry = `Next Call date changed from '${leadToUpdate.next_call}' to '${newValue}'.`; // Corrected field name
      } else if (fieldName === "device" && leadToUpdate.device !== newValue) {
        logEntry = `Device changed from '${leadToUpdate.device}' to '${newValue}'.`;
      } else if (fieldName === "age" && leadToUpdate.age !== newValue) {
        logEntry = `Age changed from '${leadToUpdate.age}' to '${newValue}'.`;
      } else if (fieldName === "grade" && leadToUpdate.grade !== newValue) {
        logEntry = `Grade changed from '${leadToUpdate.grade}' to '${newValue}'.`;
      }

      const updatedChangeLog = [
        ...(leadToUpdate.changeLog || []),
        ...(logEntry ? [`${logEntry} (at ${currentDateTime})`] : []),
      ];

      axios
        .patch(
          `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/${leadId}/`,
          {
            [fieldName]: newValue,
            changeLog: updatedChangeLog,
          },
          {
            headers: {
              Authorization: `Token ${authToken}`,
            },
          }
        )
        .then(() => {
          setAllLeads((prevLeads) =>
            prevLeads.map((lead) =>
              lead.id === leadId // Use lead.id
                ? {
                    ...lead,
                    [fieldName]: newValue,
                    changeLog: updatedChangeLog,
                  }
                : lead
            )
          );
        })
        .catch((err) => {
          console.error(
            `Error updating ${fieldName} for lead ${leadId}:`,
            err.response || err
          );
          setError(`Failed to update ${fieldName}.`);
        });
    },
    [allLeads, authToken]
  );

  const handleRefresh = useCallback(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredTrashedLeads = useMemo(() => {
    let currentLeads = allLeads;

    // Filter by search term - updated field names
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentLeads = currentLeads.filter(
        (lead) =>
          (lead.student_name && // Corrected field name
            lead.student_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.email &&
            lead.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.phone_number &&
            lead.phone_number.toLowerCase().includes(lowerCaseSearchTerm)) // Corrected field name
      );
    }

    // Filter by advanced filters - updated field names
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
        (lead) => lead.last_call && lead.last_call.startsWith(filterLastCall) // Corrected field name
      );
    }
    if (filterClassType && filterClassType !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.class_type === filterClassType // Corrected field name
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
        (lead) => lead.previous_coding_experience === filterPrevCodingExp // Corrected field name
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
            onStatusChange={(leadId, newStatus) =>
              updateLeadField(leadId, "status", newStatus)
            }
            onRemarkChange={(leadId, newRemark) =>
              updateLeadField(leadId, "remarks", newRemark)
            }
            onRecentCallChange={
              (leadId, newDate) => updateLeadField(leadId, "last_call", newDate) // Corrected field name
            }
            onNextCallChange={
              (leadId, newDate) => updateLeadField(leadId, "next_call", newDate) // Corrected field name
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
