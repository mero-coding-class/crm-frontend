// src/components/LeadTableDisplay.jsx

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  PencilIcon,
  TrashIcon,
  Bars3Icon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Menu } from "@headlessui/react";

/* ------------------------------ date helpers ------------------------------ */
const getFormattedDate = (dateString) => {
  try {
    if (!dateString || dateString === "N/A") return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(
        "LeadTableDisplay: Invalid date string received for date input (will be empty):",
        dateString
      );
      return "";
    }
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error(
      "Error formatting date in LeadTableDisplay:",
      error,
      "Original string:",
      dateString
    );
    return "";
  }
};

const formatTimestamp = (timestampString) => {
  if (!timestampString) return "N/A";
  try {
    const date = new Date(timestampString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString();
  } catch (e) {
    console.error("Error formatting timestamp:", timestampString, e);
    return "Error Date";
  }
};

/* ----------------------- course badge color helpers ----------------------- */
const normalizeCourse = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const getCourseClasses = (courseName) => {
  if (!courseName) return "bg-gray-100 text-gray-800 border-gray-200";
  const n = normalizeCourse(courseName);

  if (n.startsWith("python") && (n.includes("begin") || n.includes("begine"))) {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
  if (n.startsWith("python") && (n.includes("adv") || n.includes("advance"))) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (
    n.startsWith("scratch") &&
    (n.includes("begin") || n.includes("begine"))
  ) {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }
  if (n.startsWith("scratch") && (n.includes("adv") || n.includes("advance"))) {
    return "bg-orange-200 text-orange-900 border-orange-300";
  }
  if (n.includes("htmlcss") || (n.includes("html") && n.includes("css"))) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (n.includes("webdevelopment") || n.includes("webdev")) {
    return "bg-sky-100 text-sky-800 border-sky-200";
  }
  if (n.includes("robotics")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (
    n.includes("datascience") ||
    (n.includes("data") && n.includes("science"))
  ) {
    return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200";
  }
  if (
    n.includes("advanceai") ||
    n.includes("advancedai") ||
    (n.includes("ai") && n.includes("adv"))
  ) {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }
  return "bg-gray-100 text-gray-800 border-gray-200";
};

/* ---------------------------- change log widget --------------------------- */
const LeadLogDisplay = ({
  leadId,
  authToken,
  changeLogService,
  refreshKey,
}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedLogs = await changeLogService.getLeadLogs(
          leadId,
          authToken
        );
        const sorted = (
          Array.isArray(fetchedLogs) ? fetchedLogs : fetchedLogs?.results || []
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(sorted);
      } catch (err) {
        setError(err.message || "Failed to fetch logs.");
        console.error("Error fetching logs for lead", leadId, ":", err);
      } finally {
        setLoading(false);
      }
    };

    if (leadId && authToken && changeLogService) fetchLogs();
  }, [leadId, authToken, changeLogService, refreshKey]);

  const toggleExpansion = useCallback(() => setIsExpanded((p) => !p), []);

  const getLogEntryClasses = (changedByName) => {
    const name = changedByName ? changedByName.toLowerCase() : "";
    switch (name) {
      case "admin":
        return "bg-green-50 text-green-800 border-green-200";
      case "superadmin":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "sales_rep":
        return "bg-purple-50 text-purple-800 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatLogEntry = (log) => {
    const timestamp = formatTimestamp(log.timestamp);
    let descriptionText = log.description;

    if (
      !descriptionText &&
      log.field_changed &&
      log.old_value !== undefined &&
      log.new_value !== undefined
    ) {
      switch (log.field_changed) {
        case "status":
          descriptionText = `Status changed from '${log.old_value}' to '${log.new_value}'.`;
          break;
        case "remarks":
          descriptionText = `Remarks updated.`;
          break;
        case "last_call":
          descriptionText = `Last Call changed from '${getFormattedDate(
            log.old_value
          )}' to '${getFormattedDate(log.new_value)}'.`;
          break;
        case "next_call":
          descriptionText = `Next Call changed from '${getFormattedDate(
            log.old_value
          )}' to '${getFormattedDate(log.new_value)}'.`;
          break;
        case "age":
          descriptionText = `Age changed from '${log.old_value}' to '${log.new_value}'.`;
          break;
        case "grade":
          descriptionText = `Grade changed from '${log.old_value}' to '${log.new_value}'.`;
          break;
        default:
          descriptionText = `${log.field_changed} changed from '${log.old_value}' to '${log.new_value}'.`;
      }
    } else if (!descriptionText) {
      descriptionText = "No specific description available.";
    }

    return `${
      log.changed_by_name || "System"
    } at ${timestamp}: ${descriptionText}`;
  };

  if (loading)
    return <div className="text-gray-500 text-xs">Loading logs...</div>;
  if (error) return <div className="text-red-500 text-xs">Error: {error}</div>;
  if (!logs || logs.length === 0)
    return <div className="text-gray-500 text-xs">No log entries.</div>;

  const logsToDisplay = isExpanded ? logs : logs.slice(0, 4);
  const hasMoreLogs = logs.length > 4;

  return (
    <div
      className="whitespace-pre-wrap max-h-20 overflow-y-auto text-xs"
      style={{ minWidth: "200px" }}
    >
      {logsToDisplay.map((log) => (
        <div
          key={log.id}
          className={`mb-1 last:mb-0 p-1 rounded-sm border ${getLogEntryClasses(
            log.changed_by_name
          )}`}
        >
          {formatLogEntry(log)}
        </div>
      ))}
      {hasMoreLogs && (
        <button
          onClick={toggleExpansion}
          className="text-blue-600 hover:text-blue-800 text-xs mt-1 block underline"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};

const DraggableRow = ({ lead, columns, selected, onSelect, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${
        isDragging ? "bg-gray-100 shadow-lg" : ""
      }`}
    >
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <Bars3Icon className="h-5 w-5 text-gray-400" />
        </button>
      </td>
      <td className="px-3 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(lead._id)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      {children}
    </tr>
  );
};

const ColumnToggler = ({ columns, setColumns }) => {
  const toggleColumn = (key) => {
    setColumns((prev) => ({
      ...prev,
      [key]: { ...prev[key], visible: !prev[key].visible },
    }));
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          Columns
        </Menu.Button>
      </div>

      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 max-h-60 overflow-y-auto">
        <div className="py-1">
          {Object.entries(columns).map(([key, { label, visible }]) => (
            <Menu.Item key={key} as="div">
              {({ active }) => (
                <label
                  onClick={(e) => e.preventDefault()} // Prevent menu from closing
                  className={`${
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                  } flex items-center px-4 py-2 text-sm cursor-pointer`}
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumn(key)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                  />
                  {label}
                </label>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
};


/* ----------------------------- main component ----------------------------- */
const LeadTableDisplay = ({
  leads,
  handleEdit,
  handleDelete,
  handleBulkDelete,
  onStatusChange,
  onRemarkChange,
  onRecentCallChange,
  onNextCallChange,
  onAgeChange,
  onGradeChange,
  authToken,
  changeLogService,
}) => {
  const statusOptions = [
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

  const courseDurationOptions = ["12 Days", "40 Days", "7 Days"];
  const assignedToOptions = ["Rojina T", "Rojina G"];
  const assignedTeacherOptions = ["Rasik", "Swadesh", "Rajat", "Abhinash"];

  const getCourseDurationClasses = (duration) => {
    switch (duration) {
      case "12 Days":
        return "bg-green-100 text-green-800 border-green-200";
      case "40 Days":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "7 Days":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAssignedToClasses = (assignedTo) => {
    switch (assignedTo) {
      case "Rojina.T":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Rojina.G":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAssignedTeacherClasses = (teacher) => {
    switch (teacher) {
      case "Teacher.A":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "Teacher.B":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  const [selectedLeads, setSelectedLeads] = useState(new Set());

  const [localRemarks, setLocalRemarks] = useState({});
  useEffect(() => {
    const initialRemarks = {};
    leads.forEach((lead) => {
      initialRemarks[lead._id] = lead.remarks || "";
    });
    setLocalRemarks(initialRemarks);
  }, [leads]);

  useEffect(() => {
    setSelectedLeads(new Set());
  }, [leads]);

  const [columns, setColumns] = useState({
    studentName: { label: "Student Name", visible: true },
    parentsName: { label: "Parents' Name", visible: true },
    email: { label: "Email", visible: true },
    phone: { label: "Phone", visible: true },
    contactWhatsapp: { label: "WhatsApp Number", visible: true },
    age: { label: "Age", visible: true },
    grade: { label: "Grade", visible: true },
    source: { label: "Source", visible: true },
    course: { label: "Course", visible: true },
    courseDuration: { label: "Course Duration", visible: true },
    assignedTo: { label: "Assigned To", visible: true },
    assignedTeachers: { label: "Assigned Teacher", visible: true },
    classType: { label: "Class Type", visible: false },
    shift: { label: "Shift", visible: false },
    previousCodingExp: { label: "Previous Coding", visible: false },
    recentCall: { label: "Last Call", visible: true },
    nextCall: { label: "Next Call", visible: true },
    device: { label: "Device", visible: false },
    status: { label: "Status", visible: true },
    remarks: { label: "Remarks", visible: true },
    changeLog: { label: "Change Log", visible: true },
    actions: { label: "Actions", visible: true },
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      console.warn(
        "Drag and drop functionality is for display only. To make it persistent, pass a handler to the parent component."
      );
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageLeadIds = leads.map((lead) => lead._id);
      setSelectedLeads((prev) => new Set([...prev, ...currentPageLeadIds]));
    } else {
      const currentPageLeadIds = leads.map((lead) => lead._id);
      setSelectedLeads((prev) => {
        const newSelection = new Set(prev);
        currentPageLeadIds.forEach((id) => newSelection.delete(id));
        return newSelection;
      });
    }
  };

  const handleSelectRow = (leadId) => {
    setSelectedLeads((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(leadId)) {
        newSelection.delete(leadId);
      } else {
        newSelection.add(leadId);
      }
      return newSelection;
    });
  };

  const onBulkDeleteClick = () => {
    console.log(`Bulk delete requested for ${selectedLeads.size} leads.`);
    handleBulkDelete([...selectedLeads]);
    setSelectedLeads(new Set());
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Open":
      case "Average":
      case "Followup":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Interested":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "inProgress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "Converted":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Lost":
      case "Junk":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleLocalRemarkChange = useCallback((leadId, value) => {
    setLocalRemarks((prev) => ({ ...prev, [leadId]: value }));
  }, []);

  const handleRemarkBlur = useCallback(
    (leadId, value) => {
      onRemarkChange(leadId, value);
    },
    [onRemarkChange]
  );

  /* -------------------------- PAGINATION LOGIC -------------------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 20;

  const totalPages = Math.ceil(leads.length / leadsPerPage);
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = leads.slice(indexOfFirstLead, indexOfLastLead);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [leads.length]);

  /* ---------------------- HORIZONTAL SCROLL LOGIC ----------------------- */
  const tableContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const container = tableContainerRef.current;
    if (!container) return;

    const { clientX } = e;
    const { left, right } = container.getBoundingClientRect();
    const scrollSpeed = 10;
    const edgeThreshold = 50;

    if (clientX < left + edgeThreshold) {
      if (scrollIntervalRef.current) return;
      scrollIntervalRef.current = setInterval(() => {
        container.scrollLeft -= scrollSpeed;
      }, 20);
    } else if (clientX > right - edgeThreshold) {
      if (scrollIntervalRef.current) return;
      scrollIntervalRef.current = setInterval(() => {
        container.scrollLeft += scrollSpeed;
      }, 20);
    } else {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = null;
  }, []);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      clearInterval(scrollIntervalRef.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  if (!leads || leads.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        No active leads found matching your criteria.
      </p>
    );
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-4 space-x-2">
        {selectedLeads.size > 0 && (
          <button
            onClick={onBulkDeleteClick}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete Selected ({selectedLeads.size})
          </button>
        )}
        <ColumnToggler columns={columns} setColumns={setColumns} />
      </div>

      <div className="overflow-x-auto" ref={tableContainerRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 w-10">
                <span className="sr-only">Drag</span>
              </th>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    currentLeads.length > 0 &&
                    currentLeads.every((lead) => selectedLeads.has(lead._id))
                  }
                  indeterminate={
                    selectedLeads.size > 0 &&
                    currentLeads.some((lead) => selectedLeads.has(lead._id)) &&
                    !currentLeads.every((lead) => selectedLeads.has(lead._id))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              {Object.entries(columns).map(([key, { label, visible }]) =>
                visible ? (
                  <th
                    key={key}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {label}
                  </th>

                ) : null
              )}
            </tr>
          </thead>
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={leads.map((l) => l._id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLeads.map((lead) => {
                  const displayCourse =
                    lead.course_name || lead.courseName || lead.course || "N/A";
                  return (
                    <DraggableRow
                      key={lead._id}
                      lead={lead}
                      columns={columns}
                      selected={selectedLeads.has(lead._id)}
                      onSelect={handleSelectRow}
                    >
                      {columns.studentName.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lead.studentName}
                        </td>
                      )}
                      {columns.parentsName.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.parentsName || "N/A"}
                        </td>
                      )}
                      {columns.email.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.email}
                        </td>
                      )}
                      {columns.phone.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.phone}
                        </td>
                      )}
                      {columns.contactWhatsapp.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.contactWhatsapp}
                        </td>
                      )}
                      {columns.age.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            value={lead.age || ""}
                            onChange={(e) =>
                              onAgeChange(lead._id, e.target.value)
                            }
                            className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                            style={{ minWidth: "60px" }}
                          />
                        </td>
                      )}
                      {columns.grade.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            value={lead.grade || ""}
                            onChange={(e) =>
                              onGradeChange(lead._id, e.target.value)
                            }
                            className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                            style={{ minWidth: "60px" }}
                          />
                        </td>
                      )}
                      {columns.source.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.source}
                        </td>
                      )}
                      {columns.course.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded border ${getCourseClasses(
                              displayCourse
                            )}`}
                            title={displayCourse}
                          >
                            {displayCourse}
                          </span>
                        </td>
                      )}
                      {columns.courseDuration.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <select
                            value={lead.courseDuration || "N/A"}
                            onChange={(e) =>
                              onCourseDurationChange(lead._id, e.target.value)
                            }
                            className={`block w-full p-1 border rounded-md shadow-sm text-xs font-semibold appearance-none pr-6 ${getCourseDurationClasses(
                              lead.courseDuration
                            )}`}
                          >
                            {courseDurationOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {columns.assignedTo.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <select
                            value={lead.assignedTo || "N/A"}
                            onChange={(e) =>
                              onAssignedToChange(lead._id, e.target.value)
                            }
                            className={`block w-full p-1 border rounded-md shadow-sm text-xs font-semibold appearance-none pr-6 ${getAssignedToClasses(
                              lead.assignedTo
                            )}`}
                          >
                            {assignedToOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {columns.assignedTeachers.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <select
                            value={lead.assignedTeacher || "N/A"}
                            onChange={(e) =>
                              onAssignedTeacherChange(lead._id, e.target.value)
                            }
                            className={`block w-full p-1 border rounded-md shadow-sm text-xs font-semibold appearance-none pr-6 ${getAssignedTeacherClasses(
                              lead.assignedTeacher
                            )}`}
                          >
                            {assignedTeacherOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {columns.classType.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.classType}
                        </td>
                      )}
                      {columns.shift.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.shift}
                        </td>
                      )}
                      {columns.previousCodingExp.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.previousCodingExp}
                        </td>
                      )}
                      {columns.recentCall.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="date"
                            value={getFormattedDate(lead.recentCall)}
                            onChange={(e) =>
                              onRecentCallChange(lead._id, e.target.value)
                            }
                            className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none"
                          />
                        </td>
                      )}
                      {columns.nextCall.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="date"
                            value={getFormattedDate(lead.nextCall)}
                            onChange={(e) =>
                              onNextCallChange(lead._id, e.target.value)
                            }
                            className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none"
                          />
                        </td>
                      )}
                      {columns.device.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.device || "N/A"}
                        </td>
                      )}
                      {columns.status.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              onStatusChange(lead._id, e.target.value)
                            }
                            className={`block w-full p-1 border rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none pr-6 ${getStatusClasses(
                              lead.status
                            )}`}
                            style={{ minWidth: "100px" }}
                          >
                            {statusOptions.map((option) => (
                              <option
                                key={option}
                                value={option}
                                className={`${getStatusClasses(option)}`}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      {columns.remarks.visible && (
                        <td className="px-3 py-4 text-sm text-gray-700">
                          <textarea
                            value={localRemarks[lead._id] || ""}
                            onChange={(e) =>
                              handleLocalRemarkChange(lead._id, e.target.value)
                            }
                            onBlur={(e) =>
                              handleRemarkBlur(lead._id, e.target.value)
                            }
                            rows="2"
                            className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs focus:ring-blue-500 focus:border-blue-500"
                            style={{ minWidth: "150px" }}
                          ></textarea>
                        </td>
                      )}
                      {columns.changeLog.visible && (
                        <td className="px-3 py-4 text-sm text-gray-700">
                          <LeadLogDisplay
                            leadId={lead._id}
                            authToken={authToken}
                            changeLogService={changeLogService}
                            refreshKey={`${lead.status}|${lead.remarks}|${lead.recentCall}|${lead.nextCall}|${lead.age}|${lead.grade}`}
                          />
                        </td>
                      )}
                      {columns.actions.visible && (
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(lead)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead._id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      )}
                    </DraggableRow>
                  );
                })}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      <div className="flex justify-end items-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <span className="mx-4 text-sm font-medium text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default LeadTableDisplay;
