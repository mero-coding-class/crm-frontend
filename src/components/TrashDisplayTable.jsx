// src/components/TrashTableDisplay.jsx

import React, { useState } from "react";
import {
  TrashIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
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

const formatLogTimestamp = (isoString) => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(); // Formats to a human-readable local date/time
  } catch {
    return isoString; // Fallback to original string if invalid
  }
};

const getRoleBadgeClasses = (role) => {
  switch (role) {
    case "Admin":
      return "bg-purple-200 text-purple-800";
    case "Superadmin":
      return "bg-pink-200 text-pink-800";
    case "Sales_rep":
      return "bg-green-200 text-green-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

const TrashTableDisplay = ({
  leads,
  onStatusChange,
  onRemarkChange,
  onRecentCallChange,
  onNextCallChange,
  onPermanentDelete,
  onRestoreLead,
}) => {
  const statusOptions = [
    "Status", // Default placeholder
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
      <p className="text-center text-gray-600 py-8">No trashed leads found.</p>
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
              Age
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Grade
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Class Type
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
            <LeadRow
              key={lead.id}
              lead={lead}
              statusOptions={statusOptions}
              getStatusClasses={getStatusClasses}
              onStatusChange={onStatusChange}
              onRemarkChange={onRemarkChange}
              onRecentCallChange={onRecentCallChange}
              onNextCallChange={onNextCallChange}
              onPermanentDelete={onPermanentDelete}
              onRestoreLead={onRestoreLead}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// New sub-component for each lead row to manage its own "show more" state
const LeadRow = ({
  lead,
  statusOptions,
  getStatusClasses,
  onStatusChange,
  onRemarkChange,
  onRecentCallChange,
  onNextCallChange,
  onPermanentDelete,
  onRestoreLead,
}) => {
  const [showAllLogs, setShowAllLogs] = useState(false);

  const displayedLogs = showAllLogs
    ? lead.changeLog
    : (lead.changeLog || []).slice(0, 4);

  return (
    <tr key={lead.id} className="hover:bg-gray-50">
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {lead.student_name}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.parents_name || "N/A"}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.email}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.phone_number}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.whatsapp_number}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.age || "N/A"}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.grade || "N/A"}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.source}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.course_name}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.class_type}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.shift}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.previous_coding_experience}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        <input
          type="date"
          value={getFormattedDate(lead.last_call)}
          onChange={(e) => onRecentCallChange(lead.id, e.target.value)}
          className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none"
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        <input
          type="date"
          value={getFormattedDate(lead.next_call)}
          onChange={(e) => onNextCallChange(lead.id, e.target.value)}
          className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500 appearance-none"
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
        {lead.device || "N/A"}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
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
          onBlur={(e) => onRemarkChange(lead.id, e.target.value)} // Updated to onBlur
          rows="2"
          className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs focus:ring-blue-500 focus:border-blue-500"
          style={{ minWidth: "150px" }}
        ></textarea>
      </td>
      <td className="px-3 py-4 text-sm text-gray-700">
        <div
          className="max-h-20 overflow-y-auto text-xs"
          style={{ minWidth: "200px" }}
        >
          {displayedLogs.length > 0
            ? displayedLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-1 my-1 rounded-md ${getRoleBadgeClasses(
                    log.updaterRole
                  )}`}
                >
                  <div className="font-semibold text-gray-900">
                    {log.message}
                  </div>
                  <div className="text-gray-700 text-xs flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1 text-gray-500" />
                    {formatLogTimestamp(log.timestamp)} by{" "}
                    <span className="font-medium ml-1">{log.updaterName}</span>{" "}
                    (<span className="font-medium">{log.updaterRole}</span>)
                  </div>
                </div>
              ))
            : "No log entries."}
          {(lead.changeLog || []).length > 4 && (
            <button
              onClick={() => setShowAllLogs(!showAllLogs)}
              className="text-blue-600 hover:text-blue-800 text-xs mt-1"
            >
              {showAllLogs ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onRestoreLead(lead.id)}
          className="text-green-600 hover:text-green-900 mr-2 p-1 rounded-md hover:bg-green-50 transition-colors"
          title="Restore Lead"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => onPermanentDelete(lead.id)}
          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
          title="Permanently Delete"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
};

export default TrashTableDisplay;
