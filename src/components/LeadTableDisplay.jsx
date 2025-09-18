import React, { useState, useEffect, useRef } from "react";
import DraggableRow from "./DraggableRow";
import ColumnToggler from "./ColumnToggler";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

// Initial column configuration
const initialColumns = {
  id: { label: "ID", visible: true },
  student_name: { label: "Student Name", visible: true },
  parents_name: { label: "Parents' Name", visible: true },
  email: { label: "Email", visible: true },
  phone_number: { label: "Phone", visible: true },
  whatsapp_number: { label: "WhatsApp Number", visible: true },
  age: { label: "Age", visible: true },
  grade: { label: "Grade", visible: true },
  course_name: { label: "Course", visible: true },
  course_duration: { label: "Course Duration", visible: true },
  status: { label: "Status", visible: true },
  substatus: { label: "Sub Status", visible: true },
  source: { label: "Source", visible: true },
  class_type: { label: "Class Type", visible: true },
  shift: { label: "Shift", visible: true },
  previous_coding_experience: { label: "Previous Coding", visible: true },
  lead_type: { label: "Lead Type", visible: true },
  value: { label: "Value", visible: true },
  adset_name: { label: "Adset Name", visible: true },
  payment_type: { label: "Payment Type", visible: true },
  device: { label: "Device", visible: true },
  school_college_name: { label: "School/College", visible: true },
  demo_scheduled: { label: "Demo Scheduled", visible: true },
  last_call: { label: "Last Call", visible: true },
  next_call: { label: "Next Call", visible: true },
  created_at: { label: "Created At", visible: true },
  updated_at: { label: "Updated At", visible: true },
  remarks: { label: "Remarks", visible: true },
  address_line_1: { label: "Address Line 1", visible: false },
  address_line_2: { label: "Address Line 2", visible: false },
  city: { label: "City", visible: false },
  county: { label: "County", visible: false },
  post_code: { label: "Post Code", visible: false },
  assigned_to: { label: "Assigned To", visible: true },
  created_by_username: { label: "Created By", visible: true },
  change_log: { label: "Change Log", visible: true },
  actions: { label: "Actions", visible: true },
};

const LeadTableDisplay = ({
  leads,
  handleEdit,
  handleDelete,
  handleBulkDelete,
  onStatusChange,
  onSubStatusChange,
  onRemarkChange,
  onRecentCallChange: onLastCallChange,
  onNextCallChange,
  onAgeChange,
  onGradeChange,
  onCourseDurationChange,
  onAssignedToChange,
  authToken,
  changeLogService,
  users,
  usersLoading,
  currentUserRole,
  // pagination control (optional): parent may drive pagination
  currentPage: parentCurrentPage,
  totalPages: parentTotalPages,
  onPageChange: parentOnPageChange,
  leadsPerPage: parentLeadsPerPage,
}) => {
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [localRemarks, setLocalRemarks] = useState({});
  const [savedRemarks, setSavedRemarks] = useState({});
  const [columns, setColumns] = useState(initialColumns);
  const [internalPage, setInternalPage] = useState(1);
  const leadsPerPage = parentLeadsPerPage || 20;
  // Controlled pagination props: if parent passes currentPage/totalPages/onPageChange
  // use them; otherwise fall back to internal pagination state

  const tableContainerRef = useRef(null);
  const [scrollDirection, setScrollDirection] = useState(null);
  const scrollSpeed = 15;
  const scrollInterval = useRef(null);
  const smoothScroll = (distance) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({ left: distance, behavior: "smooth" });
  };

  // Handle mouse enter for scroll areas
  const handleMouseEnter = (direction) => {
    setScrollDirection(direction);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setScrollDirection(null);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!scrollDirection || !tableContainerRef.current) {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
        scrollInterval.current = null;
      }
      return;
    }

    scrollInterval.current = setInterval(() => {
      if (tableContainerRef.current) {
        const scrollAmount =
          scrollDirection === "left" ? -scrollSpeed : scrollSpeed;
        tableContainerRef.current.scrollLeft += scrollAmount;
      }
    }, 50);

    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
        scrollInterval.current = null;
      }
    };
  }, [scrollDirection]);

  // Normalize lead data to avoid undefined and match backend field names
  // Ensure a stable, unique `_id` for each lead so per-row state (remarks,
  // selection, change-log) doesn't collide when backend uses different id
  // fields or omits them.
  const normalizedLeads = leads.map((lead, _idx) => ({
    ...lead,
    // guarantee a unique id: prefer _id, then id, then email/phone, then index
    _id:
      lead._id || lead.id || lead.email || lead.phone_number || `lead-${_idx}`,
    // Use the actual backend ID without modification
    id: lead.id || "",
    student_name: lead.student_name || "N/A",
    parents_name: lead.parents_name || "N/A",
    email: lead.email || "",
    phone_number: lead.phone_number || "",
    whatsapp_number: lead.whatsapp_number || "",
    age: lead.age || "",
    grade: lead.grade || "",
    source: lead.source || "",
    course_name: lead.course_name || "N/A",
    class_type: lead.class_type || "",
    lead_type: lead.lead_type || lead.leadType || "",
    shift: lead.shift || "",
    last_call: lead.last_call || "",
    next_call: lead.next_call || "",
    status: lead.status || lead.status || "New",
    // backend may use `substatus` or `sub_status`
    // Ensure both variants match by using the most recently provided value
    sub_status: lead.substatus || lead.sub_status || "New",
    substatus: lead.substatus || lead.sub_status || "New",
    remarks: lead.remarks || "",
    previous_coding_experience: lead.previous_coding_experience || "",
    value: lead.value || "",
    device: lead.device || "",
    payment_type: lead.payment_type || "",
    // school/college name normalize
    school_college_name:
      lead.school_college_name || lead.school_college_name || "",
    // assigned username
    assigned_to_username:
      lead.assigned_to_username ||
      lead.assigned_to ||
      lead.assigned_to_username ||
      "",
    // ensure assigned_to is present for the editable input (prefer assigned_to, fallback to username)
    assigned_to: lead.assigned_to || lead.assigned_to_username || "",
  }));

  // Initialize remarks and selection on lead changes
  useEffect(() => {
    const initialRemarks = {};
    normalizedLeads.forEach((lead) => {
      initialRemarks[lead._id] = lead.remarks;
    });
    setLocalRemarks(initialRemarks);
    setSavedRemarks(initialRemarks);
    setSelectedLeads(new Set());
    // Reset to first page when data changes.
    // If the parent controls pagination, notify it; otherwise reset internal
    // pagination state to page 1. IMPORTANT: only reset internal page when
    // the PARENT does NOT control pagination. If the parent controls
    // pagination (it passed numeric `currentPage` and a handler), do not
    // call the parent's handler here — that would force the app back to
    // page 1 whenever `leads` changes (breaking server-driven pagination).
    if (parentControlsPagination) {
      // Parent is authoritative; don't change parent's page here.
    } else {
      // Reset internal page to 1 for client-side pagination updates.
      setInternalPage(1);
    }
  }, [leads]);

  // Keep localRemarks in sync when a remark is updated elsewhere (or from server)
  useEffect(() => {
    const onRemarkUpdated = (e) => {
      try {
        const { id, remarks } = e?.detail || {};
        if (!id) return;
        // find matching row by backend id or by constructed _id
        const match = normalizedLeads.find(
          (l) => String(l.id) === String(id) || String(l._id) === String(id)
        );
        if (match) {
          // update savedRemarks (server-confirmed) only; localRemarks remains
          // the live editing buffer controlled by the textarea onChange.
          setSavedRemarks((prev) => ({ ...prev, [match._id]: remarks }));
        }
      } catch (err) {
        console.warn(
          "LeadTableDisplay failed to handle crm:remarkUpdated",
          err
        );
      }
    };

    window.addEventListener("crm:remarkUpdated", onRemarkUpdated);
    return () =>
      window.removeEventListener("crm:remarkUpdated", onRemarkUpdated);
  }, [normalizedLeads]);

  // Mouse horizontal scroll
  // Smooth horizontal scroll on mouse move
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    let scrollDirection = 0;
    let animationFrameId;

    const edgeThreshold = 100; // px from edge
    const baseSpeed = 20; // scroll speed (increase for faster)

    const handleMouseMove = (e) => {
      const { left, right } = container.getBoundingClientRect();
      const mouseX = e.clientX;

      if (mouseX < left + edgeThreshold) {
        // Left edge → scroll left
        const distanceFromEdge = mouseX - left;
        const factor = (edgeThreshold - distanceFromEdge) / edgeThreshold;
        scrollDirection = -factor; // negative = left
      } else if (mouseX > right - edgeThreshold) {
        // Right edge → scroll right
        const distanceFromEdge = right - mouseX;
        const factor = (edgeThreshold - distanceFromEdge) / edgeThreshold;
        scrollDirection = factor; // positive = right
      } else {
        scrollDirection = 0;
      }
    };

    const handleMouseLeave = () => {
      scrollDirection = 0;
    };

    const smoothScroll = () => {
      if (scrollDirection !== 0) {
        container.scrollLeft += baseSpeed * scrollDirection;
      }
      animationFrameId = requestAnimationFrame(smoothScroll);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    animationFrameId = requestAnimationFrame(smoothScroll);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Pagination (support parent-controlled pagination)
  const computedTotalPages = Math.ceil(normalizedLeads.length / leadsPerPage);
  const totalPages = parentTotalPages || computedTotalPages;
  // Consider pagination controlled by parent only when parent provides a
  // numeric `currentPage` and a handler. This avoids treating null/undefined
  // as a signal that parent is in control.
  const parentControlsPagination =
    typeof parentCurrentPage === "number" &&
    typeof parentOnPageChange === "function";

  const currentPage = parentControlsPagination
    ? parentCurrentPage
    : internalPage;

  // Sort leads with newest first (based on createdAt/addDate if available)
  const sortedLeads = [...normalizedLeads].sort((a, b) => {
    const dateA = new Date(a.created_at || a.addDate || 0);
    const dateB = new Date(b.created_at || b.addDate || 0);
    return dateB - dateA; // newest first
  });

  // If parent controls pagination we assume it has already supplied the
  // appropriate subset of `leads`. Otherwise slice the sorted leads by internal pagination.
  const currentLeads = parentControlsPagination
    ? sortedLeads
    : sortedLeads.slice(
        (currentPage - 1) * leadsPerPage,
        currentPage * leadsPerPage
      );

  // Scroll table container to top when currentPage changes
  useEffect(() => {
    try {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (e) {
      // ignore
    }
  }, [currentPage]);

  const handleSelectRow = (leadId) => {
    setSelectedLeads((prev) => {
      const newSelection = new Set(prev);
      newSelection.has(leadId)
        ? newSelection.delete(leadId)
        : newSelection.add(leadId);
      return newSelection;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = currentLeads.map((lead) => lead._id);
      setSelectedLeads(new Set([...selectedLeads, ...ids]));
    } else {
      const newSelection = new Set(selectedLeads);
      currentLeads.forEach((lead) => newSelection.delete(lead._id));
      setSelectedLeads(newSelection);
    }
  };

  const handlePageChange = (pageNumber) => {
    console.log(
      "LeadTableDisplay: handlePageChange called with pageNumber:",
      pageNumber,
      "currentPage:",
      currentPage,
      "totalPages:",
      totalPages
    );
    // If parent controls the page (it passed parentCurrentPage), delegate
    // page changes to the parent's handler. Otherwise update internal state.
    if (typeof parentCurrentPage !== "undefined" && parentOnPageChange) {
      console.log("LeadTableDisplay: Delegating to parent onPageChange");
      parentOnPageChange(pageNumber);
      return;
    }

    if (pageNumber >= 1 && pageNumber <= totalPages) {
      console.log("LeadTableDisplay: Updating internal page to:", pageNumber);
      setInternalPage(pageNumber);
    } else {
      console.log(
        "LeadTableDisplay: Invalid page number:",
        pageNumber,
        "totalPages:",
        totalPages
      );
    }
  };

  const onBulkDeleteClick = () => {
    handleBulkDelete([...selectedLeads]);
    setSelectedLeads(new Set());
  };

  // Debug log to check incoming leads data
  console.log("Incoming leads data:", leads);

  if (!leads || leads.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        No active leads found matching your criteria.
      </p>
    );
  }

  return (
    <div>
      {/* Bulk actions & Column toggler */}
      <div className="flex justify-end items-center mb-4 space-x-2">
        {selectedLeads.size > 0 && (
          <button
            onClick={onBulkDeleteClick}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            <TrashIcon className="h-5 w-5 mr-2" /> Delete Selected (
            {selectedLeads.size})
          </button>
        )}
        <ColumnToggler columns={columns} setColumns={setColumns} />
      </div>

      {/* Table */}
      <div className="relative">
        <button
          onClick={() => smoothScroll(-500)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white rounded-full shadow hover:bg-gray-100"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <button
          onClick={() => smoothScroll(500)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white rounded-full shadow hover:bg-gray-100"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>

        <div className="overflow-x-auto" ref={tableContainerRef}>
          <DndContext collisionDetection={closestCenter}>
            <SortableContext
              items={currentLeads.map((l) => l._id)}
              strategy={verticalListSortingStrategy}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <span className="sr-only">Drag</span>
                    </th>
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={currentLeads.every((lead) =>
                          selectedLeads.has(lead._id)
                        )}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    {/** Compute visible column keys once so header and rows share the exact same order */}
                    {(() => {
                      const visibleEntries = Object.entries(columns).filter(
                        ([, { visible }]) => visible
                      );
                      const visibleKeys = visibleEntries.map(([k]) => k);
                      return visibleEntries.map(([key, { label }]) => (
                        <th
                          key={key}
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {label}
                        </th>
                      ));
                    })()}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Recompute the visible keys in the exact same order used above
                    const visibleKeys = Object.entries(columns)
                      .filter(([, { visible }]) => visible)
                      .map(([k]) => k);

                    return currentLeads.map((lead, index) => (
                      <DraggableRow
                        key={lead._id}
                        rowIndex={index}
                        lead={{
                          ...lead,
                          _users: users || [],
                          _usersLoading: usersLoading,
                          _currentUserRole: currentUserRole,
                        }}
                        columns={columns}
                        columnOrder={visibleKeys}
                        savedRemarks={savedRemarks}
                        selected={selectedLeads.has(lead._id)}
                        onSelect={handleSelectRow}
                        localRemarks={localRemarks}
                        setLocalRemarks={setLocalRemarks}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        onStatusChange={onStatusChange}
                        onSubStatusChange={onSubStatusChange}
                        onRemarkChange={onRemarkChange}
                        onRecentCallChange={onLastCallChange}
                        onNextCallChange={onNextCallChange}
                        onAgeChange={onAgeChange}
                        onGradeChange={onGradeChange}
                        onCourseDurationChange={onCourseDurationChange}
                        onAssignedToChange={onAssignedToChange}
                        authToken={authToken}
                        changeLogService={changeLogService}
                      />
                    ));
                  })()}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Pagination */}
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
