import React, { useState, useCallback, useEffect } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

// Helper function to safely format a date string into YYYY-MM-DD format,
// which is required for input type="date".
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

// Helper to format backend timestamp to a readable local string
const formatTimestamp = (timestampString) => {
  if (!timestampString) return "N/A";
  try {
    const date = new Date(timestampString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleString(); // e.g., "8/29/2025, 11:56:54 AM"
  } catch (e) {
    console.error("Error formatting timestamp:", timestampString, e);
    return "Error Date";
  }
};

// New internal component to handle fetching and displaying change logs for a single lead
const LeadLogDisplay = ({ leadId, authToken, changeLogService }) => {
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
        setLogs(fetchedLogs);
      } catch (err) {
        setError(err.message || "Failed to fetch logs.");
        console.error("Error fetching logs for lead", leadId, ":", err);
      } finally {
        setLoading(false);
      }
    };

    if (leadId && authToken) {
      fetchLogs();
    }
  }, [leadId, authToken, changeLogService]); // Re-fetch when leadId or authToken changes

  const toggleExpansion = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Helper function to get specific CSS classes based on changed_by_name
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
        return "bg-gray-50 text-gray-700 border-gray-200"; // Default for System or unknown users
    }
  };

  const formatLogEntry = (log) => {
    const timestamp = formatTimestamp(log.timestamp);
    let descriptionText = log.description; // Use the provided description by default

    // If description is generic, construct a more detailed one
    if (
      !descriptionText &&
      log.field_changed &&
      log.old_value !== undefined &&
      log.new_value !== undefined
    ) {
      if (log.field_changed === "status") {
        descriptionText = `Status changed from '${log.old_value}' to '${log.new_value}'.`;
      } else if (log.field_changed === "remarks") {
        descriptionText = `Remarks updated.`;
      } else if (log.field_changed === "last_call") {
        descriptionText = `Last Call date changed from '${getFormattedDate(
          log.old_value
        )}' to '${getFormattedDate(log.new_value)}'.`;
      } else if (log.field_changed === "next_call") {
        descriptionText = `Next Call date changed from '${getFormattedDate(
          log.old_value
        )}' to '${getFormattedDate(log.new_value)}'.`;
      } else if (log.field_changed === "age") {
        descriptionText = `Age changed from '${log.old_value}' to '${log.new_value}'.`;
      } else if (log.field_changed === "grade") {
        descriptionText = `Grade changed from '${log.old_value}' to '${log.new_value}'.`;
      } else {
        descriptionText = `${log.field_changed} changed from '${log.old_value}' to '${log.new_value}'.`;
      }
    } else if (!descriptionText) {
      descriptionText = "No specific description available.";
    }

    // "Changed by <username> at <timestamp>: <description>"
    return `${
      log.changed_by_name || "System"
    } at ${timestamp}: ${descriptionText}`;
  };

  if (loading) {
    return <div className="text-gray-500 text-xs">Loading logs...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-xs">Error: {error}</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="text-gray-500 text-xs">No log entries.</div>;
  }

  // Determine which logs to display (last 4 or all)
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

const LeadTableDisplay = ({
  leads,
  handleEdit,
  handleDelete,
  onStatusChange,
  onRemarkChange,
  onRecentCallChange,
  onNextCallChange,
  onAgeChange,
  onGradeChange,
  authToken, // Now accepting authToken
  changeLogService, // Now accepting changeLogService
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

  const [localRemarks, setLocalRemarks] = useState({});

  useEffect(() => {
    const initialRemarks = {};
    leads.forEach((lead) => {
      initialRemarks[lead._id] = lead.remarks || "";
    });
    setLocalRemarks(initialRemarks);
  }, [leads]);

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

  if (!leads || leads.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        No active leads found matching your criteria.
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
              Edit
            </th>
            <th className="relative px-3 py-3">
              <span className="sr-only">Actions</span>
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
                <input
                  type="text"
                  value={lead.age || ""}
                  onChange={(e) => onAgeChange(lead._id, e.target.value)}
                  className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  style={{ minWidth: "60px" }}
                />
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                <input
                  type="text"
                  value={lead.grade || ""}
                  onChange={(e) => onGradeChange(lead._id, e.target.value)}
                  className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  style={{ minWidth: "60px" }}
                />
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
                  value={localRemarks[lead._id] || ""}
                  onChange={(e) =>
                    handleLocalRemarkChange(lead._id, e.target.value)
                  }
                  onBlur={(e) => handleRemarkBlur(lead._id, e.target.value)}
                  rows="2"
                  className="block w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs focus:ring-blue-500 focus:border-blue-500"
                  style={{ minWidth: "150px" }}
                ></textarea>
              </td>
              <td className="px-3 py-4 text-sm text-gray-700">
                {/* Render the new LeadLogDisplay component for each lead */}
                <LeadLogDisplay
                  leadId={lead._id}
                  authToken={authToken}
                  changeLogService={changeLogService}
                />
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTableDisplay;
