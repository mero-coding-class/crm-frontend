// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Leads.jsx

import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { AuthContext } from "../App";

// Import components
import LeadTableDisplay from "../components/LeadTableDisplay";
import LeadEditModal from "../components/LeadEditModal";
import AddLeadModal from "../components/AddLeadModal";

import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

// Real API service for backend integration
const leadService = {
  getLeads: async (authToken) => {
    if (!authToken) {
      throw new Error("No authentication token found. Please log in again.");
    }

    const response = await fetch(
      "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/",
      {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include"

      }
    );

    if (!response.ok) {
      let errorMsg = "Failed to fetch leads";
      try {
        const errData = await response.json();
        if (errData.detail) errorMsg = errData.detail;
      } catch {
        // ignore error parsing
      }
      throw new Error(errorMsg);
    }

    const backendLeads = await response.json();

    // Transform backend data to frontend format
    return backendLeads.map((lead) => ({
      _id: lead.id.toString(),
      studentName: lead.student_name || "",
      parentsName: lead.parents_name || "",
      email: lead.email || "",
      phone: lead.phone_number || "",
      contactWhatsapp: lead.whatsapp_number || "",
      ageGrade: `${lead.age || ""}${
        lead.grade ? ` (Grade ${lead.grade})` : ""
      }`,
      course: lead.course || "",
      source: lead.source || "",
      addDate: lead.add_date || "",
      recentCall: lead.last_call || "",
      nextCall: lead.next_call || "",
      status: lead.status || "New",
      address: lead.address_line_1 || "",
      temporaryAddress: lead.address_line_2 || "",
      permanentAddress: lead.address_line_1 || "",
      city: lead.city || "",
      county: lead.county || "",
      postCode: lead.post_code || "",
      classType: lead.class_type || "",
      value: lead.value || "",
      adsetName: lead.adset_name || "",
      remarks: lead.remarks || "",
      shift: lead.shift || "",
      paymentType: lead.payment_type || "",
      device: lead.device || "",
      previousCodingExp: lead.previous_coding_experience || "",
      workshopBatch: lead.workshop_batch || "",
      changeLog: [],
    }));
  },

  updateLead: async (id, updates, authToken) => {
    if (!authToken) {
      throw new Error("No authentication token found. Please log in again.");
    }

    // Transform frontend field names back to backend format
    const backendUpdates = {};

    if (updates.status) backendUpdates.status = updates.status;
    if (updates.remarks !== undefined) backendUpdates.remarks = updates.remarks;
    if (updates.recentCall !== undefined)
      backendUpdates.last_call = updates.recentCall;
    if (updates.nextCall !== undefined)
      backendUpdates.next_call = updates.nextCall;
    if (updates.device !== undefined) backendUpdates.device = updates.device;

    const response = await fetch(
      `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/${id}/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendUpdates),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update lead");
    }

    return response.json();
  },
};

const Leads = () => {
  const { authToken } = useContext(AuthContext);

  // State for leads data
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
  const [filterStatus, setFilterStatus] = useState("Active"); // Default to "Status" (which acts as "All")

  // New filter states - Initial values changed as per request
  const [filterAgeGrade, setFilterAgeGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("Class"); // Changed default
  const [filterShift, setFilterShift] = useState("Shift"); // Changed default
  const [filterDevice, setFilterDevice] = useState("Device"); // Changed default
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

  // Define filter options arrays with updated "All" placeholders
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

  // Fetch leads on component mount and when authToken changes
  useEffect(() => {
    if (!authToken) {
      setError("You are not logged in. Please log in to view leads.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    leadService
      .getLeads(authToken)
      .then((data) => {
        setAllLeads(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch leads");
        setLoading(false);
      });
  }, [authToken]);

  // Functions for modals (Add Lead)
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const handleAddNewLead = useCallback(
    async (newLeadData) => {
      console.log("Adding new lead:", newLeadData);
      try {
        // Transform frontend data to backend format
        const backendData = {
          student_name: newLeadData.studentName,
          parents_name: newLeadData.parentsName,
          email: newLeadData.email,
          phone_number: newLeadData.phone,
          whatsapp_number: newLeadData.contactWhatsapp,
          age: newLeadData.ageGrade,
          source: newLeadData.source,
          class_type: newLeadData.classType,
          shift: newLeadData.shift,
          previous_coding_experience: newLeadData.previousCodingExp,
          device: newLeadData.device,
          status: newLeadData.status || "New",
          remarks: newLeadData.remarks || "",
        };

        const response = await fetch(
          "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/",
          {
            method: "POST",
            headers: {
              Authorization: `Token ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(backendData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create lead");
        }

        const newLead = await response.json();

        // Transform backend response to frontend format
        const frontendLead = {
          _id: newLead.id.toString(),
          studentName: newLead.student_name || "",
          parentsName: newLead.parents_name || "",
          email: newLead.email || "",
          phone: newLead.phone_number || "",
          contactWhatsapp: newLead.whatsapp_number || "",
          ageGrade: `${newLead.age || ""}${
            newLead.grade ? ` (Grade ${newLead.grade})` : ""
          }`,
          course: newLead.course || "",
          source: newLead.source || "",
          addDate: newLead.add_date || "",
          recentCall: newLead.last_call || "",
          nextCall: newLead.next_call || "",
          status: newLead.status || "New",
          address: newLead.address_line_1 || "",
          temporaryAddress: newLead.address_line_2 || "",
          permanentAddress: newLead.address_line_1 || "",
          city: newLead.city || "",
          county: newLead.county || "",
          postCode: newLead.post_code || "",
          classType: newLead.class_type || "",
          value: newLead.value || "",
          adsetName: newLead.adset_name || "",
          remarks: newLead.remarks || "",
          shift: newLead.shift || "",
          paymentType: newLead.payment_type || "",
          device: newLead.device || "",
          previousCodingExp: newLead.previous_coding_experience || "",
          workshopBatch: newLead.workshop_batch || "",
          changeLog: [],
        };

        setAllLeads((prevLeads) => [...prevLeads, frontendLead]);
        handleCloseAddModal();
      } catch (err) {
        setError(err.message || "Failed to create lead");
      }
    },
    [authToken, handleCloseAddModal]
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
      try {
        await leadService.updateLead(updatedLead._id, updatedLead, authToken);
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === updatedLead._id ? updatedLead : lead
          )
        );
        handleCloseEditModal();
      } catch (err) {
        setError(err.message || "Failed to update lead");
      }
    },
    [authToken, handleCloseEditModal]
  );

  // --- Functions to handle direct inline changes from LeadTableDisplay ---
  const updateLeadField = useCallback(
    async (leadId, fieldName, newValue) => {
      try {
        // Update backend first
        const updates = { [fieldName]: newValue };
        await leadService.updateLead(leadId, updates, authToken);

        // Then update frontend state
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
              } else if (
                fieldName === "nextCall" &&
                lead.nextCall !== newValue
              ) {
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

              return updatedLead;
            }
            return lead;
          })
        );
        console.log(`Lead ${leadId} ${fieldName} changed to: ${newValue}`);
      } catch (err) {
        setError(err.message || `Failed to update ${fieldName}`);
      }
    },
    [authToken]
  );

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

  // CSV Import/Export and Refresh functions
  const handleImport = useCallback(async () => {
    console.log(
      "Import CSV functionality - to be implemented with file upload."
    );
    // This will be implemented when CSV import UI is added
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch(
        "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/export-csv/",
        {
          method: "GET",
          headers: {
            Authorization: `Token ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to export CSV");
    }
  }, [authToken]);

  const handleRefresh = useCallback(async () => {
    if (!authToken) return;

    setLoading(true);
    setError(null);

    try {
      const data = await leadService.getLeads(authToken);
      setAllLeads(data);
    } catch (err) {
      setError(err.message || "Failed to refresh leads");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // This handleDelete now explicitly moves the lead to "Junk" status (archives it)
  const handleDelete = useCallback(
    async (leadId) => {
      if (window.confirm("Are you sure you want to move this lead to trash?")) {
        try {
          await leadService.updateLead(leadId, { status: "Junk" }, authToken);
          setAllLeads((prevLeads) =>
            prevLeads.map((lead) =>
              lead._id === leadId ? { ...lead, status: "Junk" } : lead
            )
          );
        } catch (err) {
          setError(err.message || "Failed to move lead to trash");
        }
      }
    },
    [authToken]
  );

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>Error: {error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
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
