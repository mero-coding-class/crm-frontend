// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Leads.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
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
        credentials: "include",
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
      age: lead.age || "",
      grade: lead.grade || "",
      course: lead.course_name || "", // Use course_name from backend
      source: lead.source || "",
      addDate: lead.add_date || "",
      recentCall: lead.last_call || "",
      nextCall: lead.next_call || "",
      status: lead.status || "New",
      permanentAddress: lead.address_line_1 || "",
      temporaryAddress: lead.address_line_2 || "",
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
      changeLog: lead.change_log || [],
    }));
  },

  updateLead: async (id, updates, authToken) => {
    if (!authToken) {
      throw new Error("No authentication token found. Please log in again.");
    }

    const backendUpdates = {};

    // Explicitly map frontend names to backend names for the API
    if (updates.status) backendUpdates.status = updates.status;
    if (updates.remarks !== undefined) backendUpdates.remarks = updates.remarks;
    if (updates.recentCall !== undefined)
      backendUpdates.last_call = updates.recentCall;
    if (updates.nextCall !== undefined)
      backendUpdates.next_call = updates.nextCall;
    if (updates.device !== undefined) backendUpdates.device = updates.device;
    if (updates.age !== undefined) backendUpdates.age = updates.age;
    if (updates.grade !== undefined) backendUpdates.grade = updates.grade;
    if (updates.permanentAddress !== undefined)
      backendUpdates.address_line_1 = updates.permanentAddress;
    if (updates.temporaryAddress !== undefined)
      backendUpdates.address_line_2 = updates.temporaryAddress;
    if (updates.city !== undefined) backendUpdates.city = updates.city;
    if (updates.county !== undefined) backendUpdates.county = updates.county;
    if (updates.postCode !== undefined)
      backendUpdates.post_code = updates.postCode;
    if (updates.studentName !== undefined)
      backendUpdates.student_name = updates.studentName;
    if (updates.parentsName !== undefined)
      backendUpdates.parents_name = updates.parentsName;
    if (updates.email !== undefined) backendUpdates.email = updates.email;
    if (updates.phone !== undefined)
      backendUpdates.phone_number = updates.phone;
    if (updates.contactWhatsapp !== undefined)
      backendUpdates.whatsapp_number = updates.contactWhatsapp;
    if (updates.course !== undefined) backendUpdates.course = updates.course;
    if (updates.source !== undefined) backendUpdates.source = updates.source;
    if (updates.classType !== undefined)
      backendUpdates.class_type = updates.classType;
    if (updates.value !== undefined) backendUpdates.value = updates.value;
    if (updates.adsetName !== undefined)
      backendUpdates.adset_name = updates.adsetName;
    if (updates.shift !== undefined) backendUpdates.shift = updates.shift;
    if (updates.paymentType !== undefined)
      backendUpdates.payment_type = updates.paymentType;
    if (updates.previousCodingExp !== undefined)
      backendUpdates.previous_coding_experience = updates.previousCodingExp;
    if (updates.workshopBatch !== undefined)
      backendUpdates.workshop_batch = updates.workshopBatch;
    if (updates.changeLog !== undefined)
      backendUpdates.change_log = updates.changeLog;

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
      let errorMsg = "Failed to update lead";
      try {
        const errData = await response.json();
        if (errData.detail) errorMsg = errData.detail;
      } catch {
        // ignore error parsing
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },
};

// Services are simplified or removed as the backend will handle these actions
const changeLogService = {
  getLeadLogs: async (leadId, authToken) => {
    if (!authToken) {
      throw new Error("No authentication token found. Please log in again.");
    }
    const response = await fetch(
      `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/${leadId}/logs/`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      let errorMsg = "Failed to fetch change logs";
      try {
        const errData = await response.json();
        if (errData.detail) errorMsg = errData.detail;
      } catch {
        // ignore error parsing
      }
      throw new Error(errorMsg);
    }
    const logs = await response.json();
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
};

const courseService = {
  getCourses: async (authToken) => {
    if (!authToken) {
      throw new Error("No authentication token found. Please log in again.");
    }

    const response = await fetch(
      "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/courses/",
      {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      let errorMsg = "Failed to fetch courses";
      try {
        const errData = await response.json();
        if (errData.detail) errorMsg = errData.detail;
      } catch {
        // ignore error parsing
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  },
};

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

  useEffect(() => {
    if (!authToken) {
      setError("You are not logged in. Please log in to view leads.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      leadService.getLeads(authToken),
      courseService.getCourses(authToken),
    ])
      .then(([leadsData, coursesData]) => {
        setAllLeads(leadsData);
        setCourses(coursesData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch data");
        setLoading(false);
      });
  }, [authToken]);

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
        const selectedCourse = courses.find(
          (c) => c.course_name === newLeadData.course
        );
        const courseId = selectedCourse ? selectedCourse.id : null;

        const backendData = {
          student_name: newLeadData.studentName || "",
          parents_name: newLeadData.parentsName || "",
          email: newLeadData.email || "",
          phone_number: newLeadData.phone || "",
          whatsapp_number: newLeadData.contactWhatsapp || "",
          age: newLeadData.age || "",
          grade: newLeadData.grade || "",
          source: newLeadData.source || "",
          class_type: newLeadData.classType || "",
          shift: newLeadData.shift || "",
          previous_coding_experience: newLeadData.previousCodingExp || "",
          device: newLeadData.device || "",
          status: newLeadData.status || "New",
          remarks: newLeadData.remarks || "",
          course: courseId,
          value: newLeadData.value || "",
          adset_name: newLeadData.adsetName || "",
          payment_type: newLeadData.paymentType || "",
          workshop_batch: newLeadData.workshopBatch || "",
          address_line_1: newLeadData.permanentAddress || "",
          address_line_2: newLeadData.temporaryAddress || "",
          city: newLeadData.city || "",
          county: newLeadData.county || "",
          post_code: newLeadData.postCode || "",
          change_log: [],
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
          const errorText = await response.text();
          console.error("Failed to create lead:", errorText);
          throw new Error("Failed to create lead: " + errorText);
        }

        const newLead = await response.json();
        console.log("New lead successfully created:", newLead);

        const frontendLead = {
          _id: newLead.id.toString(),
          studentName: newLead.student_name || "",
          parentsName: newLead.parents_name || "",
          email: newLead.email || "",
          phone: newLead.phone_number || "",
          contactWhatsapp: newLead.whatsapp_number || "",
          age: newLead.age || "",
          grade: newLead.grade || "",
          course: newLead.course_name || "",
          source: newLead.source || "",
          addDate: newLead.add_date || "",
          recentCall: newLead.last_call || "",
          nextCall: newLead.next_call || "",
          status: newLead.status || "New",
          permanentAddress: newLead.address_line_1 || "",
          temporaryAddress: newLead.address_line_2 || "",
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
        };

        setAllLeads((prevLeads) => [...prevLeads, frontendLead]);
        handleCloseAddModal();
      } catch (err) {
        setError(err.message || "Failed to create lead");
      }
    },
    [authToken, handleCloseAddModal, courses]
  );

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
      try {
        const backendUpdates = {
          student_name: updatedLead.studentName,
          parents_name: updatedLead.parentsName,
          email: updatedLead.email,
          phone_number: updatedLead.phone,
          whatsapp_number: updatedLead.contactWhatsapp,
          age: updatedLead.age,
          grade: updatedLead.grade,
          course:
            courses.find((c) => c.course_name === updatedLead.course)?.id ||
            null,
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
          change_log: updatedLead.changeLog,
        };

        await leadService.updateLead(
          updatedLead._id,
          backendUpdates,
          authToken
        );
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
    [authToken, handleCloseEditModal, courses]
  );

  const updateLeadField = useCallback(
    async (leadId, fieldName, newValue) => {
      try {
        // If the status is being changed to 'Converted', 'Lost', or 'Junk',
        // we'll send a single PATCH request to the lead endpoint.
        // The backend will handle the subsequent enrollment/trashing.
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
          // If the update is successful, remove the lead from the local state
          setAllLeads((prevLeads) =>
            prevLeads.filter((lead) => lead._id !== leadId)
          );
          return; // Exit after processing the status change
        }

        // For all other field updates (that are not status changes)
        const updatesToSend = { [fieldName]: newValue };
        if (fieldName === "course") {
          const selectedCourse = courses.find(
            (c) => c.course_name === newValue
          );
          updatesToSend.course = selectedCourse ? selectedCourse.id : null;
        }

        await leadService.updateLead(leadId, updatesToSend, authToken);

        // Update the local state with the new value
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) => {
            if (lead._id === leadId) {
              const updatedLead = { ...lead, [fieldName]: newValue };
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
    [authToken, allLeads, courses]
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
  const handleAgeChange = useCallback(
    (leadId, newAge) => {
      updateLeadField(leadId, "age", newAge);
    },
    [updateLeadField]
  );

  const handleGradeChange = useCallback(
    (leadId, newGrade) => {
      updateLeadField(leadId, "grade", newGrade);
    },
    [updateLeadField]
  );

  const handleImport = useCallback(async () => {
    console.log(
      "Import CSV functionality - to be implemented with file upload."
    );
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
          // Send a PATCH request to change the status to "Junk"
          // The backend will handle the actual move to trash.
          await leadService.updateLead(leadId, { status: "Junk" }, authToken);
          // Remove from local state after successful API call
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

  const displayedLeads = useMemo(() => {
    let currentLeads = allLeads;

    if (filterStatus && filterStatus !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }

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
            onStatusChange={handleStatusChange}
            onRemarkChange={handleRemarkChange}
            onRecentCallChange={handleRecentCallChange}
            onNextCallChange={handleNextCallChange}
            onDelete={handleDelete}
            onAgeChange={handleAgeChange}
            onGradeChange={handleGradeChange}
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