// src/components/DraggableRow.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import LeadLogDisplay from "./LeadLogDisplay";
import { getCourseClasses, getStatusClasses } from "./helpers"; // Removed unused getFormattedDate

const DraggableRow = ({
  lead,
  columns,
  selected,
  onSelect,
  localRemarks,
  setLocalRemarks,
  handleEdit,
  handleDelete,
  onStatusChange,
  onRemarkChange,
  onRecentCallChange: onLastCallChange,
  onNextCallChange,
  onAgeChange,
  onGradeChange,
  onCourseDurationChange,
  onAssignedToChange,
  authToken,
  changeLogService,
}) => {
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

  // No need for additional normalization as it's handled in parent component

  const handleLocalRemarkChange = (value) =>
    setLocalRemarks((prev) => ({ ...prev, [lead._id]: value }));

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

      {/* Dynamic Column Rendering - no changes needed here */}
      {Object.entries(columns).map(([key, column]) => {
        if (!column.visible) return null;

        const renderCell = () => {
          switch (key) {
            case "student_name":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.student_name || "N/A"}
                </td>
              );
            case "parents_name":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.parents_name || "N/A"}
                </td>
              );
            case "email":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.email || ""}
                </td>
              );
            case "phone_number":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.phone_number || ""}
                </td>
              );
            case "whatsapp_number":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.whatsapp_number || ""}
                </td>
              );
            // ... inside renderCell for "age":
            case "age":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  <input
                    type="text"
                    value={lead.age ?? ""} // show "" if null
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") {
                        // Inform user and prevent sending an empty value
                        window.alert(
                          "This field cannot be empty. Please enter an age or cancel."
                        );
                        return;
                      }
                      onAgeChange(lead._id, v);
                    }}
                    className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
              );

            // ... same for "grade":
            case "grade":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  <input
                    type="text"
                    value={lead.grade ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") {
                        window.alert(
                          "This field cannot be empty. Please enter a grade or cancel."
                        );
                        return;
                      }
                      onGradeChange(lead._id, v);
                    }}
                    className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
              );
            case "source":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.source}
                </td>
              );
            case "course_name":
              // Debug log to check course name value
              console.log(
                "Course name for lead:",
                lead._id,
                "is:",
                lead.course_name
              );
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded border ${getCourseClasses(
                      lead.course_name
                    )}`}
                    title={lead.course_name}
                  >
                    {lead.course_name && lead.course_name !== "null"
                      ? lead.course_name
                      : "N/A"}
                  </span>
                </td>
              );
            case "course_duration":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  <input
                    type="text"
                    value={lead.course_duration || ""}
                    onChange={(e) =>
                      onCourseDurationChange(lead._id, e.target.value)
                    }
                    className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
              );
            case "assigned_to":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  <input
                    type="text"
                    value={lead.assigned_to || ""}
                    onChange={(e) =>
                      onAssignedToChange(lead._id, e.target.value)
                    }
                    className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
              );
            case "last_call":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  <input
                    type="date"
                    value={lead.last_call ? lead.last_call.split("T")[0] : ""}
                    onChange={(e) => onLastCallChange(lead._id, e.target.value)}
                    className="block w-full p-1 border rounded-md shadow-sm text-xs font-semibold"
                  />
                </td>
              );
            case "next_call":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  <input
                    type="date"
                    value={lead.next_call ? lead.next_call.split("T")[0] : ""}
                    onChange={(e) => onNextCallChange(lead._id, e.target.value)}
                    className="block w-full p-1 border rounded-md shadow-sm text-xs font-semibold"
                  />
                </td>
              );
            case "status":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-sm min-w-[140px]">
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead._id, e.target.value)}
                    className={`block w-full p-1 border rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none pr-6 ${getStatusClasses(
                      lead.status
                    )}`}
                  >
                    {[
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
                    ].map((option) => (
                      <option
                        key={option}
                        value={option}
                        className={getStatusClasses(option)}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
              );

            case "remarks":
              return (
                <td className="px-3 py-4 text-sm text-gray-700 min-w-[300px]">
                  <textarea
                    value={localRemarks[lead._id] || ""}
                    onChange={(e) => handleLocalRemarkChange(e.target.value)}
                    onBlur={(e) => onRemarkChange(lead._id, e.target.value)}
                    rows="3"
                    className="block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
                    placeholder="Add remarks..."
                  ></textarea>
                </td>
              );
            case "change_log":
              return (
                <td className="px-3 py-4 text-sm text-gray-700">
                  <LeadLogDisplay
                    leadId={lead._id}
                    authToken={authToken}
                    changeLogService={changeLogService}
                    refreshKey={`${lead.status}|${lead.remarks}|${lead.last_call}|${lead.next_call}|${lead.age}|${lead.grade}`}
                  />
                </td>
              );
            case "actions":
              return (
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(lead)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded-md hover:bg-indigo-50"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(lead._id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              );
            default:
              return null;
          }
        };

        return renderCell();
      })}
    </tr>
  );
};

export default DraggableRow;
