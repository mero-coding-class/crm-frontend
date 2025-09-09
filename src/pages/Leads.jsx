import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import LeadTableDisplay from "../components/LeadTableDisplay";
import LeadEditModal from "../components/LeadEditModal";
import AddLeadModal from "../components/AddLeadModal";
import ImportCsvButton from "../components/ImportCsvButton";

import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

import { leadService, courseService, changeLogService } from "../services/api";

const Leads = () => {
  const { authToken } = useAuth();

  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Active");

  const [filterAge, setFilterAge] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("Class");
  const [filterShift, setFilterShift] = useState("Shift");
  const [filterDevice, setFilterDevice] = useState("Device");
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("CodingExp");
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    "All",
    "New",
    "Open",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Active",
    "Converted",
    "Lost",
    "Junk",
  ];

  const classTypeOptions = ["Class", "Online", "Physical"];
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
    "7 P.P. - 8 P.M.",
  ];
  const deviceOptions = ["Device", "Yes", "No"];
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

  // Load leads & courses
  useEffect(() => {
    if (!authToken) {
      setError("You are not logged in. Please log in to view leads.");
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [leadsData, coursesData] = await Promise.all([
          leadService.getLeads(authToken),
          courseService.getCourses(authToken),
        ]);
        setAllLeads(leadsData);
        setCourses(coursesData);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [authToken]);

  const handleOpenAddModal = useCallback(() => setIsAddModalOpen(true), []);
  const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);

  // Add lead via service; map course to ID if needed, then update state immediately
  // Corrected handleAddNewLead function
  // Corrected handleAddNewLead function with data transformation
  const handleAddNewLead = useCallback(
    async (newLeadData) => {
      try {
        let courseId = null;
        if (newLeadData.status === "Converted") {
          await fetch(
            "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/enrollments/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify(payload),
            }
          );
          handleCloseAddModal();
          return;
        }

        if (newLeadData.status === "Lost" || newLeadData.status === "Junk") {
          await fetch(
            "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/trash/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify(payload),
            }
          );
          handleCloseAddModal();
          return;
        }

        // Transform the data to match back-end field names
        const payload = {
          student_name: newLeadData.studentName,
          parents_name: newLeadData.parentsName,
          phone_number: newLeadData.phone,
          // Add other fields you need to transform here
          course_name: newLeadData.course,
          email: newLeadData.email,
          // etc.
          ...newLeadData, // Spread the rest of the data
          course: courseId,
        };

        const createdLead = await leadService.addLead(payload, authToken);

        // Now, use the complete newLeadData object to update the state,
        // and merge the new _id from the back end.
        const updatedLeadForState = { ...newLeadData, _id: createdLead.id };
        setAllLeads([updatedLeadForState, ...allLeads]);

        setSearchTerm("");
        setFilterStatus("Active");
        handleCloseAddModal();
      } catch (err) {
        setError(err.message || "Failed to create lead");
      }
    },
    [authToken, courses, allLeads, handleCloseAddModal]
  );
  const handleEdit = useCallback((lead) => {
    setEditingLead(lead);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingLead(null);
  }, []);

  // Save edits: send camelCase object; map course name -> id if needed
  const handleSaveEdit = useCallback(
    async (updatedLead) => {
      try {
        let payload = { ...updatedLead };
        if (updatedLead.course != null) {
          const selected = courses.find(
            (c) =>
              c.course_name === updatedLead.course ||
              c.id === updatedLead.course
          );
          payload.course = selected ? selected.id : updatedLead.course;
        }

        await leadService.updateLead(updatedLead._id, payload, authToken);

        // Update local copy
        setAllLeads((prev) =>
          prev.map((l) =>
            l._id === updatedLead._id ? { ...l, ...updatedLead } : l
          )
        );

        handleCloseEditModal();
      } catch (err) {
        setError(err.message || "Failed to update lead");
      }
    },
    [authToken, courses, handleCloseEditModal]
  );

  // Single-field update from table cells
  const updateLeadField = useCallback(
    async (leadId, fieldName, newValue) => {
      try {
        // Special behavior for status transitions
        if (
          fieldName === "status" &&
          (newValue === "Converted" ||
            newValue === "Lost" ||
            newValue === "Junk")
        ) {
          await leadService.updateLead(
            leadId,
            { [fieldName]: newValue },
            authToken
          );
          setAllLeads((prevLeads) =>
            prevLeads.filter((lead) => lead._id !== leadId)
          );
          return;
        }

        // Map course name -> id on change
        const updatesToSend = { [fieldName]: newValue };
        if (fieldName === "course") {
          const selectedCourse = courses.find(
            (c) => c.course_name === newValue || c.id === newValue
          );
          updatesToSend.course = selectedCourse ? selectedCourse.id : newValue;
        }

        await leadService.updateLead(leadId, updatesToSend, authToken);

        // Local update
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, [fieldName]: newValue } : lead
          )
        );
        console.log(`Lead ${leadId} ${fieldName} changed to: ${newValue}`);
      } catch (err) {
        setError(err.message || `Failed to update ${fieldName}`);
      }
    },
    [authToken, courses]
  );

  const handleStatusChange = useCallback(
    (leadId, newStatus) => updateLeadField(leadId, "status", newStatus),
    [updateLeadField]
  );
  const handleRemarkChange = useCallback(
    (leadId, newRemark) => updateLeadField(leadId, "remarks", newRemark),
    [updateLeadField]
  );
  const handleRecentCallChange = useCallback(
    (leadId, newDate) => updateLeadField(leadId, "recentCall", newDate),
    [updateLeadField]
  );
  const handleNextCallChange = useCallback(
    (leadId, newDate) => updateLeadField(leadId, "nextCall", newDate),
    [updateLeadField]
  );
  const handleAgeChange = useCallback(
    (leadId, newAge) => updateLeadField(leadId, "age", newAge),
    [updateLeadField]
  );
  const handleGradeChange = useCallback(
    (leadId, newGrade) => updateLeadField(leadId, "grade", newGrade),
    [updateLeadField]
  );

  const handleCourseDurationChange = useCallback(
    (leadId, newDuration) =>
      updateLeadField(leadId, "courseDuration", newDuration),
    [updateLeadField]
  );

  const handleAssignedToChange = useCallback(
    (leadId, newAssignedTo) =>
      updateLeadField(leadId, "assignedTo", newAssignedTo),
    [updateLeadField]
  );

  const handleExport = useCallback(async () => {
    try {
      const blob = await leadService.exportLeads(authToken);
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
      const courseData = await courseService.getCourses(authToken);
      setCourses(courseData);
    } catch (err) {
      setError(err.message || "Failed to refresh leads");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const handleDelete = useCallback(
    async (leadId) => {
      if (window.confirm("Are you sure you want to move this lead to trash?")) {
        try {
          await leadService.updateLead(leadId, { status: "Junk" }, authToken);
          setAllLeads((prevLeads) =>
            prevLeads.filter((lead) => lead._id !== leadId)
          );
        } catch (err) {
          setError(err.message || "Failed to move lead to trash");
        }
      }
    },
    [authToken]
  );

  const handleBulkDelete = useCallback(
    async (leadIds) => {
      try {
        await Promise.all(
          leadIds.map((id) =>
            leadService.updateLead(id, { status: "Junk" }, authToken)
          )
        );
        // Remove the leads from the local state
        setAllLeads((prevLeads) =>
          prevLeads.filter((lead) => !leadIds.includes(lead._id))
        );
      } catch (err) {
        setError(err.message || "Failed to move selected leads to trash");
      }
    },
    [authToken]
  );

  // Filtering
  const displayedLeads = useMemo(() => {
    let currentLeads = allLeads.filter(
      (lead) =>
        lead.status !== "Converted" &&
        lead.status !== "Lost" &&
        lead.status !== "Junk"
    );

    if (filterStatus && filterStatus !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      currentLeads = currentLeads.filter(
        (lead) =>
          (lead.studentName && lead.studentName.toLowerCase().includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          (lead.phone && lead.phone.toLowerCase().includes(q))
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
        (lead) => lead.recentCall && lead.recentCall === filterLastCall
      );
    }
    if (filterClassType && filterClassType !== "Class") {
      currentLeads = currentLeads.filter(
        (lead) => lead.classType === filterClassType
      );
    }
    if (filterShift && filterShift !== "Shift") {
      currentLeads = currentLeads.filter((lead) => lead.shift === filterShift);
    }
    if (filterDevice && filterDevice !== "Device") {
      currentLeads = currentLeads.filter(
        (lead) => lead.device === filterDevice
      );
    }
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

          {/* Import CSV (posts to /leads/from/ via service) */}
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

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <LeadTableDisplay
            leads={displayedLeads}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleBulkDelete={handleBulkDelete}
            onStatusChange={handleStatusChange}
            onRemarkChange={handleRemarkChange}
            onRecentCallChange={handleRecentCallChange}
            onNextCallChange={handleNextCallChange}
            onAgeChange={handleAgeChange}
            onGradeChange={handleGradeChange}
            onCourseDurationChange={handleCourseDurationChange}
            onAssignedToChange={handleAssignedToChange}
            authToken={authToken}
            changeLogService={changeLogService}
          />
        )}
      </div>

      {isEditModalOpen && editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          courses={courses}
        />
      )}
      {isAddModalOpen && (
        <AddLeadModal
          onClose={handleCloseAddModal}
          onSave={handleAddNewLead}
          courses={courses}
        />
      )}
    </div>
  );
};

export default Leads;
