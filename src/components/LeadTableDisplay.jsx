import React, { useState, useEffect, useRef, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import DraggableRow from "./DraggableRow";
import ColumnToggler from "./ColumnToggler";
import { leadService } from "../services/api";

// NOTE: This file was rebuilt to remove syntax errors and provide
// reliable inline update handlers for course_type, class_type, and scheduled_taken.
// Keep this component focused on display + delegating updates; heavy logic
// (like change log diffing) should remain in services or row component.

// Initial column configuration
const initialColumns = {
  actions: { label: "Actions", visible: true },
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
  course_type: { label: "Course Type", visible: true },
  status: { label: "Status", visible: true },
  substatus: { label: "Sub Status", visible: true },
  source: { label: "Source", visible: true },
  class_type: { label: "Class Type", visible: true },
  shift: { label: "Shift", visible: true },
  previous_coding_experience: { label: "Previous Coding", visible: false },
  lead_type: { label: "Lead Type", visible: false },
  value: { label: "Value", visible: false },
  adset_name: { label: "Adset Name", visible: false },
  payment_type: { label: "Payment Type", visible: false },
  first_installment: { label: "First Installment", visible: false },
  first_invoice: { label: "First Invoice", visible: false },
  device: { label: "Device", visible: false },
  school_college_name: { label: "School/College", visible: false },
  scheduled_taken: { label: "Scheduled Taken", visible: true },
  last_call: { label: "Last Call", visible: true },
  next_call: { label: "Next Call", visible: true },
  created_at: { label: "Created At", visible: false },
  updated_at: { label: "Updated At", visible: false },
  remarks: { label: "Remarks", visible: true },
  address_line_1: { label: "Address Line 1", visible: false },
  address_line_2: { label: "Address Line 2", visible: false },
  city: { label: "City", visible: false },
  county: { label: "County", visible: false },
  post_code: { label: "Post Code", visible: false },
  assigned_to: { label: "Assigned To", visible: true },
  created_by_username: { label: "Created By", visible: false },
  change_log: { label: "Change Log", visible: true },
};

const LeadTableDisplay = ({
  leads = [],
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
  onShiftChange,
  onDemoScheduledChange,
  onAssignedToChange,
  authToken,
  changeLogService,
  users = [],
  usersLoading = false,
  currentUserRole,
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
  const pageSize = parentLeadsPerPage || 20;

  const tableContainerRef = useRef(null);

  // Smooth scroll helper used by the arrow buttons
  const smoothScroll = (distance) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({ left: distance, behavior: "smooth" });
  };

  // Edge-hover horizontal auto-scroll ONLY.
  // Mouse wheel should remain vertical (no conversion). Horizontal scroll happens
  // only when pointer is near left/right edges.
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const hasOverflow = () => container.scrollWidth > container.clientWidth + 2;
    if (!hasOverflow()) return; // no need to attach handlers

    let direction = 0; // -1..1
    let rafId;
    const EDGE = 100;
    const SPEED = 18; // px per frame at full edge pressure

    const updateDirection = (x) => {
      const { left, right } = container.getBoundingClientRect();
      if (x < left + EDGE) {
        const dist = x - left;
        const factor = (EDGE - dist) / EDGE; // 0..1
        direction = -factor;
      } else if (x > right - EDGE) {
        const dist = right - x;
        const factor = (EDGE - dist) / EDGE;
        direction = factor;
      } else direction = 0;
    };

    const onPointerMove = (e) => updateDirection(e.clientX);
    const onPointerLeave = () => (direction = 0);

    const step = () => {
      if (direction !== 0) {
        container.scrollLeft += direction * SPEED;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    container.addEventListener("mousemove", onPointerMove); // fallback
    container.addEventListener("mouseleave", onPointerLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("mouseleave", onPointerLeave);
    };
  }, [leads, columns]);

  // Normalize lead data to avoid undefined and match backend field names
  // Ensure a stable, unique `_id` for each lead so per-row state (remarks,
  // selection, change-log) doesn't collide when backend uses different id
  // fields or omits them.
  const normalizedLeads = useMemo(
    () =>
      leads.map((lead, _idx) => ({
        ...lead,
        // guarantee a unique id: prefer _id, then id, then email/phone, then index
        _id:
          lead._id ||
          lead.id ||
          lead.email ||
          lead.phone_number ||
          `lead-${_idx}`,
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
      })),
    [leads]
  );

  // Initialize remarks and selection on lead changes
  useEffect(() => {
    const initialRemarks = {};
    normalizedLeads.forEach((lead) => {
      initialRemarks[lead._id] = lead.remarks;
    });
    setLocalRemarks(initialRemarks);
    setSavedRemarks(initialRemarks);
    setSelectedLeads(new Set());

    if (parentControlsPagination) {
      // Parent is authoritative; don't change parent's page here.
    } else {
      // Reset internal page to 1 for client-side pagination updates.
      setInternalPage(1);
    }
  }, [normalizedLeads]);

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

  // (Removed previous advanced scroll behaviors: wheel vertical->horizontal translation, drag inertia, and duplicate pointer edge logic)

  const computedTotalPages = Math.ceil(normalizedLeads.length / pageSize) || 1;
  const totalPages = parentTotalPages || computedTotalPages;

  const parentControlsPagination =
    typeof parentCurrentPage === "number" &&
    typeof parentOnPageChange === "function";

  const currentPage = parentControlsPagination
    ? parentCurrentPage
    : internalPage;

  const sortedLeads = [...normalizedLeads].sort((a, b) => {
    const dateA = new Date(a.created_at || a.addDate || 0);
    const dateB = new Date(b.created_at || b.addDate || 0);
    return dateB - dateA; // newest first
  });

  // If parent controls pagination we assume it has already supplied the
  // appropriate subset of `leads`. Otherwise slice the sorted leads by internal pagination.
  const currentLeads = parentControlsPagination
    ? sortedLeads
    : sortedLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
  // Inline update handlers for course_type & class_type
  const handleCourseTypeChange = async (leadId, value) => {
    try {
      await leadService.updateLead(leadId, { course_type: value }, authToken);
    } catch (e) {
      console.warn("Failed to update course_type", e);
    }
  };

  const handleClassTypeChange = async (leadId, value) => {
    try {
      await leadService.updateLead(leadId, { class_type: value }, authToken);
    } catch (e) {
      console.warn("Failed to update class_type", e);
    }
  };

  // Forward scheduled_taken changes (legacy prop name kept for row component)
  const handleScheduledTakenChange = async (leadId, value) => {
    try {
      await leadService.updateLead(
        leadId,
        { scheduled_taken: value },
        authToken
      );
      if (typeof onDemoScheduledChange === "function") {
        onDemoScheduledChange(leadId, value);
      }
    } catch (e) {
      console.warn("Failed to update scheduled_taken", e);
    }
  };

  const visibleKeys = useMemo(
    () =>
      Object.entries(columns)
        .filter(([, c]) => c.visible)
        .map(([k]) => k),
    [columns]
  );

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

        <div
          className="overflow-x-auto custom-scrollbar"
          ref={tableContainerRef}
        >
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
                    return currentLeads.map((lead, index) => (
                      <DraggableRow
                        key={lead._id}
                        rowIndex={index}
                        lead={{
                          ...lead,
                          _users: users || [],
                          _usersLoading: usersLoading,
                          _currentUserRole: currentUserRole,
                          class_type: lead.class_type || "",
                          course_type: lead.course_type || "",
                          scheduled_taken:
                            lead.scheduled_taken || lead.demo_scheduled || "No",
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
                        onShiftChange={onShiftChange}
                        // onDemoScheduledChange prop name retained for backward compatibility.
                        // Internally this updates canonical scheduled_taken field.
                        onDemoScheduledChange={handleScheduledTakenChange}
                        onAssignedToChange={onAssignedToChange}
                        authToken={authToken}
                        changeLogService={changeLogService}
                        onCourseTypeChange={handleCourseTypeChange}
                        onClassTypeChange={handleClassTypeChange}
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
