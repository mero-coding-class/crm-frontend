// src/components/DraggableRow.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import LeadLogDisplay from "./LeadLogDisplay";
import {
  getCourseClasses,
  getStatusClasses,
  getSubStatusClasses,
} from "./helpers"; // Removed unused getFormattedDate

const DraggableRow = ({
  lead,
  columns,
  columnOrder, // array of visible column keys in header order
  rowIndex, // sequential number for display
  selected,
  onSelect,
  localRemarks,
  setLocalRemarks,
  savedRemarks,
  handleEdit,
  handleDelete,
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
  // Debug assigned fields
  console.log(`Row assigned fields for ${lead._id}:`, {
    assigned_to: lead.assigned_to,
    assigned_to_username: lead.assigned_to_username,
  });
  const handleLocalRemarkChange = (value) => {
    const leadId = lead._id || lead.id; // Use either ID format
    setLocalRemarks((prev) => ({ ...prev, [leadId]: value }));
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

      {/* Dynamic Column Rendering - no changes needed here */}
      {(columnOrder || Object.keys(columns)).map((key) => {
        // support older prop shapes: if columnOrder not provided, skip invisible
        if (!columnOrder && !columns[key].visible) return null;

        const renderCell = () => {
          switch (key) {
            case "substatus":
              // Read either variant (sub_status or substatus) so the UI shows
              // the most recently-updated value regardless of naming used by
              // upstream code or the API merge logic.
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-lg border shadow-sm ${getSubStatusClasses(
                      lead.substatus || lead.sub_status
                    )}`}
                  >
                    <select
                      value={lead.substatus || lead.sub_status || "New"}
                      onChange={(e) => {
                        // Update frontend state and backend
                        if (onSubStatusChange) {
                          onSubStatusChange(lead._id, e.target.value);
                        }
                      }}
                      className="bg-transparent border-0 p-0 m-0 text-sm font-semibold appearance-none focus:outline-none text-current"
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
                  </div>
                </td>
              );
            case "student_name":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                >
                  {lead.student_name || "N/A"}
                </td>
              );
            case "id":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {/* Display actual backend ID */}
                  {lead.id || "-"}
                </td>
              );
            case "parents_name":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {lead.parents_name || "N/A"}
                </td>
              );
            case "email":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {lead.email || ""}
                </td>
              );
            case "phone_number":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {lead.phone_number || ""}
                </td>
              );
            case "whatsapp_number":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {lead.whatsapp_number || ""}
                </td>
              );
            // ... inside renderCell for "age":
            case "age":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  <input
                    type="text"
                    value={
                      lead.age !== undefined && lead.age !== null
                        ? Math.floor(Number(lead.age))
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      const leadId = lead._id || lead.id; // Use either ID format
                      onAgeChange(leadId, v);
                    }}
                    className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
              );

            // ... same for "grade":
            case "grade":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  <input
                    type="text"
                    value={
                      lead.grade !== undefined && lead.grade !== null
                        ? Math.floor(Number(lead.grade))
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      const leadId = lead._id || lead.id; // Use either ID format
                      onGradeChange(leadId, v);
                    }}
                    className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
              );
            case "source":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
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
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
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
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
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
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {lead._usersLoading ? (
                    <div className="mt-1 p-1 text-sm">Loading users...</div>
                  ) : (
                    <select
                      value={lead.assigned_to_username || ""}
                      onChange={(e) =>
                        onAssignedToChange(lead._id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">
                        {Array.isArray(lead._users) && lead._users.length > 0
                          ? "(Unassigned)"
                          : "(No users available)"}
                      </option>
                      {Array.isArray(lead._users) &&
                        lead._users.map((u) => (
                          <option key={u.username} value={u.username}>
                            {u.username || u.name || String(u.id)}
                          </option>
                        ))}
                    </select>
                  )}
                </td>
              );
            case "last_call":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
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
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
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
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm min-w-[140px]"
                >
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead._id, e.target.value)}
                    className={`block w-full p-1 border rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none pr-6 ${getStatusClasses(
                      lead.status
                    )}`}
                  >
                    {["Active", "Converted", "Lost"].map((option) => (
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
                <td
                  key={key}
                  className="px-3 py-4 text-sm text-gray-700 min-w-[300px]"
                >
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
                <td key={key} className="px-3 py-4 text-sm text-gray-700">
                  <LeadLogDisplay
                    // Use backend id when available so the logs endpoint receives
                    // the expected primary key. Fall back to _id otherwise.
                    leadId={lead.id || lead._id}
                    authToken={authToken}
                    changeLogService={changeLogService}
                    // Use savedRemarks (server-confirmed) so logs refresh only
                    // after the remark has been saved and acknowledged.
                    refreshKey={`${lead.status}|${
                      (savedRemarks && savedRemarks[lead._id]) || lead.remarks
                    }|${lead.last_call}|${lead.next_call}|${lead.age}|${
                      lead.grade
                    }`}
                  />
                </td>
              );
            case "actions":
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
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
              // Generic renderer: look up the value on the lead object using
              // common variants (snake_case and camelCase). This covers
              // dynamically toggled columns where a specific case isn't
              // implemented above.
              const getFieldValue = (obj, key) => {
                if (!obj) return "";
                // direct key (snake_case)
                if (obj[key] !== undefined && obj[key] !== null)
                  return obj[key];
                // camelCase fallback
                const camel = key.replace(/_([a-z])/g, (m, p1) =>
                  p1.toUpperCase()
                );
                if (obj[camel] !== undefined && obj[camel] !== null)
                  return obj[camel];
                // also try variants without underscore (e.g., substatus)
                const compact = key.replace(/_/g, "");
                if (obj[compact] !== undefined && obj[compact] !== null)
                  return obj[compact];
                return "";
              };

              const cellValue = getFieldValue(lead, key);
              return (
                <td
                  key={key}
                  className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {cellValue}
                </td>
              );
          }
        };

        return renderCell();
      })}
    </tr>
  );
};

export default DraggableRow;
