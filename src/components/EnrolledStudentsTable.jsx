import React, { useState, useEffect, useRef } from "react";
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

// --- BACKGROUND COLORS FOR FIELDS ---
const FIELD_BG_CLASSES = {
  batch_name: "bg-purple-100",
  assigned_teacher: "bg-blue-100",
  course_duration: "bg-green-100",
};

// Format date display
const formatDisplayDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

// Resolve a field from enrollment first, then fallback to nested lead object
const resolveField = (student, key) => {
  if (!student) return "";
  const v = student[key];
  if (v !== undefined && v !== null) return v;
  if (student.lead && (student.lead[key] !== undefined && student.lead[key] !== null))
    return student.lead[key];
  return "";
};

// Column toggler
const ColumnToggler = ({ columns, setColumns }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleColumn = (key) => {
    setColumns((prev) => ({
      ...prev,
      [key]: { ...prev[key], visible: !prev[key].visible },
    }));
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          Columns
        </button>
      </div>
      {isDropdownOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 max-h-60 overflow-y-auto">
          <div className="py-1">
            {Object.entries(columns).map(([key, { label, visible }]) => (
              <label
                key={key}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleColumn(key)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Editable text cell
const EditableTextCell = ({ value, field, onSave }) => {
  const [text, setText] = useState(value || "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setText(value || "");
  }, [value]);

  // Only save on blur or Enter
  const handleBlur = () => {
    if (editing) {
      setEditing(false);
      if (text !== value) {
        onSave(text);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setEditing(true);
  };

  return (
    <td className={`px-3 py-4 whitespace-nowrap text-sm`}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1 ${
          FIELD_BG_CLASSES[field] || "bg-white"
        }`}
      />
    </td>
  );
};

const EnrolledStudentsTable = ({
  students = [],
  handleEdit,
  handleDelete,
  handleBulkDelete,
  onUpdatePaymentStatus,
  onUpdateField,
  courses = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [orderedStudents, setOrderedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [columns, setColumns] = useState({
    student_name: { label: "Student Name", visible: true },
    parents_name: { label: "Parents' Name", visible: true },
    // (Lead-related fields removed to hide lead-level columns)
    email: { label: "Email", visible: true },
    phone_number: { label: "Phone", visible: true },
    whatsapp_number: { label: "WhatsApp", visible: false },
    grade: { label: "Grade", visible: false },
    source: { label: "Source", visible: false },
    class_type: { label: "Class Type", visible: false },
    shift: { label: "Shift", visible: false },
    device: { label: "Device", visible: false },
    previous_coding_experience: { label: "Prev Coding Exp", visible: false },
    course_name: { label: "Course", visible: true },
    batchname: { label: "Batch Name", visible: true },
    assigned_teacher: { label: "Assigned Teacher", visible: true },
    course_duration: { label: "Course Duration", visible: true },
    starting_date: { label: "Starting Date", visible: true },
    total_payment: { label: "Total Payment", visible: true },
    first_installment: { label: "1st Installment", visible: false },
    second_installment: { label: "2nd Installment", visible: false },
    third_installment: { label: "3rd Installment", visible: false },
    last_pay_date: { label: "Last Pay Date", visible: true },
    payment_completed: { label: "Payment Completed", visible: true },
    adset_name: { label: "Adset Name", visible: false },
    remarks: { label: "Remarks", visible: false },
    address_line_1: { label: "Address 1", visible: false },
    address_line_2: { label: "Address 2", visible: false },
    city: { label: "City", visible: false },
    county: { label: "County", visible: false },
    post_code: { label: "Post Code", visible: false },
    demo_scheduled: { label: "Demo Scheduled", visible: false },
    // Enrollment-level metadata
    actions: { label: "Actions", visible: true },
    created_at: { label: "Enrollment Created", visible: false },
    updated_at: { label: "Enrollment Updated", visible: false },
  });

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    setOrderedStudents(students);
    setSelectedStudents(new Set());
  }, [students]);

  // (no-op cleanup required here; requestAnimationFrame-based scroll effect handles its own cleanup)

  // Instant field update

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setOrderedStudents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(orderedStudents.map((s) => s.id));
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectRow = (studentId) => {
    setSelectedStudents((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(studentId)) newSelection.delete(studentId);
      else newSelection.add(studentId);
      return newSelection;
    });
  };

  const handleDeleteSelected = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedStudents.size} selected students?`
      )
    ) {
      handleBulkDelete([...selectedStudents]);
    }
  };

  // Smooth horizontal scroll on mouse move (requestAnimationFrame)
  useEffect(() => {
    const container = scrollContainerRef.current;
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

  // Scroll to top when page changes
  useEffect(() => {
    try {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    } catch (e) {
      // ignore errors
    }
  }, [currentPage]);

  if (!students || students.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        No enrolled students found.
      </p>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 space-x-2">
        {selectedStudents.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete Selected ({selectedStudents.size})
          </button>
        )}
        <div className="flex-grow"></div>
        <ColumnToggler columns={columns} setColumns={setColumns} />
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto custom-scrollbar"
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
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
                    onChange={handleSelectAll}
                    checked={selectedStudents.size === orderedStudents.length}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                {/* Render headers in a stable order so cells align correctly. Ensure 'actions' is first among visible columns. */}
                {(() => {
                  const visibleKeys = Object.keys(columns).filter(
                    (k) => columns[k].visible
                  );
                  // Place actions first if present
                  const orderedKeys = visibleKeys.includes("actions")
                    ? ["actions", ...visibleKeys.filter((k) => k !== "actions")]
                    : visibleKeys;
                  return orderedKeys.map((key) => (
                    <th
                      key={key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {columns[key].label}
                    </th>
                  ));
                })()}
              </tr>
            </thead>
            <SortableContext
              items={orderedStudents.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white divide-y divide-gray-200">
                {orderedStudents.map((student) => {
                  const visibleKeys = Object.keys(columns).filter(
                    (k) => columns[k].visible
                  );
                  const orderedKeys = visibleKeys.includes("actions")
                    ? ["actions", ...visibleKeys.filter((k) => k !== "actions")]
                    : visibleKeys;
                  return (
                    <SortableStudentRow
                      key={student.id}
                      student={student}
                      columns={columns}
                      visibleKeys={orderedKeys}
                      isSelected={selectedStudents.has(student.id)}
                      onSelectRow={handleSelectRow}
                      handleEdit={handleEdit}
                      handleDelete={handleDelete}
                      handlePaymentStatusChange={onUpdatePaymentStatus}
                      onUpdateField={onUpdateField}
                      courses={courses}
                    />
                  );
                })}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

      {/* pagination is handled at the page level (EnrolledStudents.jsx) */}
    </div>
  );
};

// Sortable row
const SortableStudentRow = ({
  student,
  columns,
  visibleKeys = [],
  isSelected,
  onSelectRow,
  handleEdit,
  handleDelete,
  handlePaymentStatusChange,
  onUpdateField,
  courses = [],
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: student.id });
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
      <td className="px-3 py-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <Bars3Icon className="h-5 w-5 text-gray-400" />
        </button>
      </td>
      <td className="px-3 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectRow(student.id)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>

      {/* Render cells in the same stable order as headers */}
      {visibleKeys.map((key) => {
        // If this is a nested lead field (we prefix columns with lead_), render editable input for student.lead
        if (key.startsWith("lead_")) {
          const leadKey = key.replace("lead_", "");
          const val = student.lead ? student.lead[leadKey] : "";
          // Render date picker for date fields
          if (
            [
              "add_date",
              "last_call",
              "next_call",
              "created_at",
              "updated_at",
            ].includes(leadKey)
          ) {
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                <input
                  type="date"
                  value={val ? val.split("T")[0] : ""}
                  onChange={(e) =>
                    onUpdateField(student.id, `lead.${leadKey}`, e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                />
              </td>
            );
          }
          // Render select for status/substatus
          if (leadKey === "status") {
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                <select
                  value={val || "Active"}
                  onChange={(e) =>
                    onUpdateField(student.id, `lead.${leadKey}`, e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                >
                  {["Active", "Converted", "Lost"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </td>
            );
          }
          if (leadKey === "substatus") {
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                <select
                  value={val || "New"}
                  onChange={(e) =>
                    onUpdateField(student.id, `lead.${leadKey}`, e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                >
                  {[
                    "New",
                    "Open",
                    "Followup",
                    "inProgress",
                    "Average",
                    "Interested",
                    "Junk",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </td>
            );
          }
          // Render text input for all other fields
          return (
            <td
              key={key}
              className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
            >
              <input
                type="text"
                value={val}
                onChange={(e) =>
                  onUpdateField(student.id, `lead.${leadKey}`, e.target.value)
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
              />
            </td>
          );
        }
        switch (key) {
          case "student_name":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              >
                {student.student_name ||
                  (student.lead && student.lead.student_name) ||
                  "N/A"}
              </td>
            );
          case "parents_name":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                {student.parents_name ||
                  (student.lead && student.lead.parents_name) ||
                  "N/A"}
              </td>
            );
          case "email":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                {student.email || (student.lead && student.lead.email) || ""}
              </td>
            );
          case "phone_number":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                {student.phone_number ||
                  (student.lead && student.lead.phone_number) ||
                  ""}
              </td>
            );
          case "course_name":
            // Prefer explicit course_name on the enrollment, then try to
            // resolve a course id to a course_name from the fetched courses
            // list, then fallback to lead.course_name or raw course value.
            const courseDisplay = (() => {
              if (student.course_name) return student.course_name;
              // If course is an id, try to find it in the provided courses list
              const c = student.course;
              if (c !== undefined && c !== null) {
                if (typeof c === "number" || typeof c === "string") {
                  const found = courses.find(
                    (co) => String(co.id) === String(c)
                  );
                  if (found && (found.course_name || found.name))
                    return found.course_name || found.name;
                  // if student.course is a string and not an id, display it
                  if (typeof c === "string") return c;
                }
                if (typeof c === "object") {
                  return (
                    c.course_name || c.name || String(c.id || JSON.stringify(c))
                  );
                }
              }
              if (student.lead && student.lead.course_name)
                return student.lead.course_name;
              return "";
            })();
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                {courseDisplay || "N/A"}
              </td>
            );
          case "batchname":
          case "assigned_teacher":
          case "course_duration":
            return (
              <EditableTextCell
                key={key}
                field={key}
                value={student[key] ?? (student.lead ? student.lead[key] : "")}
                onSave={(v) => onUpdateField(student.id, key, v)}
              />
            );
          case "last_pay_date":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                <input
                  type="date"
                  value={
                    student.last_pay_date
                      ? student.last_pay_date.split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    onUpdateField(student.id, "last_pay_date", e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                />
              </td>
            );
          case "course":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                <select
                  value={student.course || ""}
                  onChange={(e) =>
                    onUpdateField(student.id, "course", e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_name || c.name}
                    </option>
                  ))}
                </select>
              </td>
            );
          case "total_payment":
            return (
              <EditableTextCell
                key={key}
                field={key}
                value={student.total_payment || ""}
                onSave={(v) => onUpdateField(student.id, "total_payment", v)}
              />
            );
          case "first_installment":
          case "second_installment":
          case "third_installment":
            return (
              <EditableTextCell
                key={key}
                field={key}
                value={student[key] || ""}
                onSave={(v) => onUpdateField(student.id, key, v)}
              />
            );
          case "starting_date":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                <input
                  type="date"
                  value={student.starting_date || ""}
                  onChange={(e) =>
                    onUpdateField(student.id, "starting_date", e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                />
              </td>
            );
          case "payment_completed":
            return (
              <td key={key} className="px-3 py-4 whitespace-nowrap text-sm">
                <select
                  value={student.payment_completed ? "Yes" : "No"}
                  onChange={(e) => {
                    const newValue = e.target.value === "Yes";
                    handlePaymentStatusChange(student.id, newValue);
                    onUpdateField(student.id, "payment_completed", newValue);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
            );
          case "actions":
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  onClick={() => handleEdit(student)}
                  className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            );
          default:
            return (
              <td
                key={key}
                className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                {String(resolveField(student, key) ?? "")}
              </td>
            );
        }
      })}
    </tr>
  );
};

export default EnrolledStudentsTable;
