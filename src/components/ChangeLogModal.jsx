// src/components/ChangeLogModal.jsx

import React, { useEffect, useState } from "react";
import { changeLogService } from "../services/api";
import Modal from "./Modal"; // Assuming you have a generic Modal component

const ChangeLogModal = ({ leadId, onClose, authToken }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!leadId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await changeLogService.getLeadLogs(leadId, authToken);
        setLogs(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch change logs.");
        console.error("Error fetching change logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [leadId, authToken]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getLogMessage = (log) => {
    // Customize this logic based on your backend log format
    if (
      log.field &&
      log.old_value !== undefined &&
      log.new_value !== undefined
    ) {
      return `Updated "${log.field}" from "${log.old_value}" to "${log.new_value}"`;
    }
    return log.message || "An unspecified change occurred.";
  };

  return (
    <Modal title="Change Log" onClose={onClose}>
      <div className="p-4 overflow-y-auto max-h-[70vh]">
        {loading && (
          <p className="text-center text-gray-500">Loading logs...</p>
        )}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && logs.length === 0 && (
          <p className="text-center text-gray-500">
            No changes have been logged for this lead.
          </p>
        )}
        {!loading && logs.length > 0 && (
          <ul className="space-y-4">
            {logs.map((log, index) => (
              <li key={index} className="border-b pb-2 last:border-b-0">
                <div className="font-semibold text-gray-800">
                  {getLogMessage(log)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Timestamp:</span>{" "}
                  {formatTimestamp(log.timestamp)}
                </div>
                {/* Add other details if available, like the user who made the change */}
                {log.user_name && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">By:</span> {log.user_name}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default ChangeLogModal;
