import React from "react";
import {
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon, // New icon for restore
} from "@heroicons/react/24/outline";

// Helper function to safely format date for input type="date"
const getFormattedDate = (dateString) => {
  try {
    if (!dateString || dateString === "N/A") return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(
        "TrashTableDisplay: Invalid date string received for date input (will be empty):",
        dateString
      );
      return "";
    }
    return date.toISOString().split("T")[0]; // Format to YYYY-MM-DD
  } catch (error) {
    console.error(
      "Error formatting date in TrashTableDisplay:",
      error,
      "Original string:",
      dateString
    );
    return "";
  }
};

const TrashTableDisplay = ({
  leads, // These will be the "trashed" leads passed from the parent (TrashPage.jsx)
  handleEdit, // Pass through the edit function (optional in trash, but kept for consistency)
  onStatusChange, // Allow changing status even in trash (e.g., to restore)
  onRemarkChange,
  onRecentCallChange,
  onNextCallChange,
  onPermanentDelete, // New prop for permanent delete
  onRestoreLead, // New prop for restoring a lead
}) => {
  const statusOptions = [
    "Status", // Placeholder option
    "New",
    "Open",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Active",
    "Closed",
    "Converted",
    "Lost",
    "Junk",
  ];

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
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "Converted":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Closed":
        return "bg-gray-200 text-gray-800 border-gray-300";
      case "Lost":
      case "Junk":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!leads || leads.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        No trashed leads found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student Name
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Parents' Name
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              WhatsApp Number
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age/grade
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ClassType
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shift
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Previous Coding
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Call
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Next Call
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Device
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Remarks
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change Log
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead._id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {lead.studentName}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.parentsName || "N/A"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.email}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.phone}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.contactWhatsapp}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.ageGrade}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.source}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.course}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.classType}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.shift}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.previousCodingExp}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                <input
                  type="date"
                  value={getFormattedDate(lead.recentCall)}
                  onChange={(e) => onRecentCallChange(lead._id, e.target.value)}
                  className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none"
                />
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                <input
                  type="date"
                  value={getFormattedDate(lead.nextCall)}
                  onChange={(e) => onNextCallChange(lead._id, e.target.value)}
                  className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none"
                />
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {lead.device || "N/A"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm">
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead._id, e.target.value)}
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
              <td className="px-3 py-4 text-sm text-gray-700">
                <textarea
                  value={lead.remarks || ""}
                  onChange={(e) => onRemarkChange(lead._id, e.target.value)}
                  rows="2"
                  className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs focus:ring-blue-500 focus:border-blue-500"
                  style={{ minWidth: "150px" }}
                ></textarea>
              </td>
              <td className="px-3 py-4 text-sm text-gray-700">
                <div
                  className="whitespace-pre-wrap max-h-20 overflow-y-auto text-xs"
                  style={{ minWidth: "200px" }}
                >
                  {lead.changeLog && lead.changeLog.length > 0
                    ? lead.changeLog.join("\n")
                    : "No log entries."}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                {/* Restore the lead */}
                <button
                  onClick={() => onRestoreLead(lead._id)}
                  className="text-green-600 hover:text-green-900 mr-2 p-1 rounded-md hover:bg-green-50 transition-colors"
                  title="Restore Lead"
                >
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                </button>
                {/* Permanent delete */}
                <button
                  onClick={() => onPermanentDelete(lead._id)}
                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                  title="Permanently Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrashTableDisplay;
