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

// Dummy data for students
const DUMMY_STUDENTS = [
  {
    id: 1,
    student_name: "Alice Johnson",
    parents_name: "Robert & Mary Johnson",
    email: "alice.j@example.com",
    phone_number: "555-0101",
    course_name: "Computer Science",
    total_payment: 1200.0,
    first_installment: 400.0,
    second_installment: 400.0,
    third_installment: 400.0,
    last_pay_date: "2024-03-15",
    payment_completed: true,
    batch_name: "Batch 101",
    assigned_teacher: "Rashik",
    course_duration: "6 months", // Note: This will be replaced by new durations
    starting_date: "2024-01-10",
  },
  {
    id: 2,
    student_name: "Bob Williams",
    parents_name: "David Williams",
    email: "bob.w@example.com",
    phone_number: "555-0102",
    course_name: "Data Analytics",
    total_payment: 1500.0,
    first_installment: 500.0,
    second_installment: 500.0,
    third_installment: null,
    last_pay_date: "2024-04-20",
    payment_completed: false,
    batch_name: "Batch 102",
    assigned_teacher: "Rajat",
    course_duration: "8 months", // Note: This will be replaced by new durations
    starting_date: "2024-02-15",
  },
  {
    id: 3,
    student_name: "Charlie Brown",
    parents_name: "Sally Brown",
    email: "charlie.b@example.com",
    phone_number: "555-0103",
    course_name: "Graphic Design",
    total_payment: 900.0,
    first_installment: 300.0,
    second_installment: 300.0,
    third_installment: null,
    last_pay_date: "2024-03-05",
    payment_completed: false,
    batch_name: "Batch 103",
    assigned_teacher: "Swadesh",
    course_duration: "4 months", // Note: This will be replaced by new durations
    starting_date: "2024-03-01",
  },
];

// --- UPDATED OPTIONS AND COLORS ---
const BATCH_NAMES = ["Batch 101", "Batch 102", "Batch 103", "Batch 104"];
const TEACHER_NAMES = ["Rashik", "Rajat", "Swadesh", "Abhinash"];
const COURSE_DURATIONS = ["7 days", "12 days", "20 days", "40 days"];

// Background colors for dropdown options
const DROPDOWN_COLORS_MAP = {
  "Batch 101": "bg-purple-100",
  "Batch 102": "bg-blue-100",
  "Batch 103": "bg-yellow-100",
  "Batch 104": "bg-green-100",
  Rashik: "bg-pink-100",
  Rajat: "bg-indigo-100",
  Swadesh: "bg-teal-100",
  Abhinash: "bg-orange-100",
  "7 days": "bg-red-100",
  "12 days": "bg-fuchsia-100",
  "20 days": "bg-sky-100",
  "40 days": "bg-lime-100",
};
// --- END UPDATED SECTIONS ---

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

// Reusable component for dropdown cells
const DropdownCell = ({ value, options, onSave, field }) => {
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelectChange = (e) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);
    onSave(newValue);
  };

  const getOptionColorClass = (optionValue) => {
    return DROPDOWN_COLORS_MAP[optionValue] || "bg-white";
  };

  return (
    <td className="px-3 py-4 whitespace-nowrap text-sm">
      <select
        value={selectedValue || ""}
        onChange={handleSelectChange}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1 ${
          selectedValue && getOptionColorClass(selectedValue)
        }`}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className={getOptionColorClass(option)}
          >
            {option}
          </option>
        ))}
      </select>
    </td>
  );
};

const EnrolledStudentsTable = ({
  students = DUMMY_STUDENTS,
  handleEdit,
  handleDelete,
  handleBulkDelete,
  onUpdatePaymentStatus,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [orderedStudents, setOrderedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [columns, setColumns] = useState({
    student_name: { label: "Student Name", visible: true },
    parents_name: { label: "Parents' Name", visible: true },
    email: { label: "Email", visible: true },
    phone_number: { label: "Phone", visible: true },
    course_name: { label: "Course", visible: true },
    batch_name: { label: "Batch Name", visible: true },
    assigned_teacher: { label: "Assigned Teacher", visible: true },
    course_duration: { label: "Course Duration", visible: true },
    starting_date: { label: "Starting Date", visible: true },
    total_payment: { label: "Total Payment", visible: true },
    first_installment: { label: "1st Installment", visible: false },
    second_installment: { label: "2nd Installment", visible: false },
    third_installment: { label: "3rd Installment", visible: false },
    last_pay_date: { label: "Last Pay Date", visible: true },
    payment_completed: { label: "Payment Completed", visible: true },
    actions: { label: "Actions", visible: true },
  });

  const scrollContainerRef = useRef(null);
  const [scrollInterval, setScrollInterval] = useState(null);
  const scrollSpeed = 5;

  useEffect(() => {
    setOrderedStudents(students);
    setSelectedStudents(new Set());
  }, [students]);

  useEffect(() => {
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [scrollInterval]);

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
      const allStudentIds = new Set(orderedStudents.map((s) => s.id));
      setSelectedStudents(allStudentIds);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectRow = (studentId) => {
    setSelectedStudents((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(studentId)) {
        newSelection.delete(studentId);
      } else {
        newSelection.add(studentId);
      }
      return newSelection;
    });
  };

  const handleUpdateField = (id, field, value) => {
    setOrderedStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === id ? { ...student, [field]: value } : student
      )
    );
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

  const handlePaymentStatusChange = (studentId, newStatus) => {
    onUpdatePaymentStatus(studentId, newStatus === "Yes");
  };

  const handleMouseMove = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const clientX = e.clientX;
    const boundary = 50;
    let direction = 0;
    if (clientX < containerRect.left + boundary) {
      direction = -1;
    } else if (clientX > containerRect.right - boundary) {
      direction = 1;
    }
    if (direction !== 0 && !scrollInterval) {
      const interval = setInterval(() => {
        if (container) {
          container.scrollLeft += direction * scrollSpeed;
        }
      }, 20);
      setScrollInterval(interval);
    } else if (direction === 0 && scrollInterval) {
      clearInterval(scrollInterval);
      setScrollInterval(null);
    }
  };

  const handleMouseLeave = () => {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      setScrollInterval(null);
    }
  };

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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
                    checked={
                      students.length > 0 &&
                      selectedStudents.size === students.length
                    }
                    indeterminate={
                      selectedStudents.size > 0 &&
                      selectedStudents.size < students.length
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
            <SortableContext
              items={students.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white divide-y divide-gray-200">
                {orderedStudents.map((student) => (
                  <SortableStudentRow
                    key={student.id}
                    student={student}
                    columns={columns}
                    isSelected={selectedStudents.has(student.id)}
                    onSelectRow={handleSelectRow}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handlePaymentStatusChange={handlePaymentStatusChange}
                    onUpdateField={handleUpdateField}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-4 space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

const SortableStudentRow = ({
  student,
  columns,
  isSelected,
  onSelectRow,
  handleEdit,
  handleDelete,
  handlePaymentStatusChange,
  onUpdateField,
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
      {columns.student_name.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {student.student_name}
        </td>
      )}
      {columns.parents_name.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.parents_name || "N/A"}
        </td>
      )}
      {columns.email.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.email}
        </td>
      )}
      {columns.phone_number.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.phone_number}
        </td>
      )}
      {columns.course_name.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.course_name}
        </td>
      )}

      {/* Batch Name Dropdown */}
      {columns.batch_name.visible && (
        <DropdownCell
          value={student.batch_name}
          options={BATCH_NAMES}
          onSave={(value) => onUpdateField(student.id, "batch_name", value)}
          field="batch_name"
        />
      )}

      {/* Assigned Teacher Dropdown */}
      {columns.assigned_teacher.visible && (
        <DropdownCell
          value={student.assigned_teacher}
          options={TEACHER_NAMES}
          onSave={(value) =>
            onUpdateField(student.id, "assigned_teacher", value)
          }
          field="assigned_teacher"
        />
      )}

      {/* Course Duration Dropdown */}
      {columns.course_duration.visible && (
        <DropdownCell
          value={student.course_duration}
          options={COURSE_DURATIONS}
          onSave={(value) =>
            onUpdateField(student.id, "course_duration", value)
          }
          field="course_duration"
        />
      )}

      {/* Starting Date */}
      {columns.starting_date.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          <input
            type="date"
            value={student.starting_date || ""}
            onChange={(e) =>
              onUpdateField(student.id, "starting_date", e.target.value)
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
          />
        </td>
      )}

      {columns.total_payment.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.total_payment
            ? `Rs ${parseFloat(student.total_payment).toFixed(2)}`
            : "N/A"}
        </td>
      )}
      {columns.first_installment.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.first_installment
            ? `Rs ${parseFloat(student.first_installment).toFixed(2)}`
            : "N/A"}
        </td>
      )}
      {columns.second_installment.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.second_installment
            ? `Rs ${parseFloat(student.second_installment).toFixed(2)}`
            : "N/A"}
        </td>
      )}
      {columns.third_installment.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {student.third_installment
            ? `Rs ${parseFloat(student.third_installment).toFixed(2)}`
            : "N/A"}
        </td>
      )}
      {columns.last_pay_date.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
          {formatDisplayDate(student.last_pay_date)}
        </td>
      )}
      {columns.payment_completed.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-sm">
          <select
            value={student.payment_completed ? "Yes" : "No"}
            onChange={(e) =>
              handlePaymentStatusChange(student.id, e.target.value)
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </td>
      )}
      {columns.actions.visible && (
        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
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
      )}
    </tr>
  );
};

export default EnrolledStudentsTable;
