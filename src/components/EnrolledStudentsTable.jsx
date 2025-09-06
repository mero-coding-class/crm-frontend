import React, { useState, useEffect, useMemo, useRef } from "react";
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
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            {Object.entries(columns).map(([key, { label }]) => (
              <label
                key={key}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={columns[key].visible}
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

const EnrolledStudentsTable = ({
  students,
  handleEdit,
  handleDelete,
  handleBulkDelete,
  onUpdatePaymentStatus,
}) => {
  const [orderedStudents, setOrderedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [columns, setColumns] = useState({
    student_name: { label: "Student Name", visible: true },
    parents_name: { label: "Parents' Name", visible: true },
    email: { label: "Email", visible: true },
    phone_number: { label: "Phone", visible: true },
    course_name: { label: "Course", visible: true },
    total_payment: { label: "Total Payment", visible: true },
    first_installment: { label: "1st Installment", visible: false },
    second_installment: { label: "2nd Installment", visible: false },
    third_installment: { label: "3rd Installment", visible: false },
    last_pay_date: { label: "Last Pay Date", visible: true },
    payment_completed: { label: "Payment Completed", visible: true },
    actions: { label: "Actions", visible: true },
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(students.length / itemsPerPage);

  const scrollContainerRef = useRef(null);
  const [scrollInterval, setScrollInterval] = useState(null);
  const scrollSpeed = 5; // Pixels per interval

  useEffect(() => {
    setOrderedStudents(students);
    setSelectedStudents(new Set());
    setCurrentPage(1);
  }, [students]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [scrollInterval]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orderedStudents.slice(startIndex, endIndex);
  }, [orderedStudents, currentPage, itemsPerPage]);

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
      const allStudentIds = new Set(paginatedStudents.map((s) => s.id));
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

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setSelectedStudents(new Set());
    }
  };

  const handleMouseMove = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const clientX = e.clientX;
    const boundary = 50; // Pixels from the edge to start scrolling

    let direction = 0;
    if (clientX < containerRect.left + boundary) {
      direction = -1; // Scroll left
    } else if (clientX > containerRect.right - boundary) {
      direction = 1; // Scroll right
    }

    if (direction !== 0 && !scrollInterval) {
      const interval = setInterval(() => {
        if (container) {
          container.scrollLeft += direction * scrollSpeed;
        }
      }, 20); // Interval speed
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
                      paginatedStudents.length > 0 &&
                      selectedStudents.size === paginatedStudents.length
                    }
                    indeterminate={
                      selectedStudents.size > 0 &&
                      selectedStudents.size < paginatedStudents.length
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
              items={paginatedStudents.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStudents.map((student) => (
                  <SortableStudentRow
                    key={student.id}
                    student={student}
                    columns={columns}
                    isSelected={selectedStudents.has(student.id)}
                    onSelectRow={handleSelectRow}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handlePaymentStatusChange={handlePaymentStatusChange}
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
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
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
