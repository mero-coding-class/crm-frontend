// src/components/LeadLogDisplay.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getFormattedDate, formatTimestamp } from "./helpers";

const LeadLogDisplay = ({
  leadId,
  authToken,
  changeLogService,
  refreshKey,
}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const syntheticRef = React.useRef([]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedLogs = await changeLogService.getLeadLogs(
          leadId,
          authToken
        );
        const sorted = (
          Array.isArray(fetchedLogs) ? fetchedLogs : fetchedLogs?.results || []
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        // If we have optimistic synthetic logs (recent, client-created) then
        // merge them on top unless the server now contains the same entry.
        const synths = syntheticRef.current || [];
        if (synths.length === 0) {
          setLogs(sorted);
        } else {
          // If the top server log matches any synthetic (by new_value), drop synths
          const topServer = sorted[0];
          const matched =
            topServer &&
            synths.some((s) => s.new_value === topServer.new_value);
          if (matched) {
            // Server has persisted the change — clear synthetic cache and show server logs
            syntheticRef.current = [];
            setLogs(sorted);
          } else {
            // Keep synths at the top followed by server logs
            setLogs([...synths, ...sorted]);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to fetch logs.");
      } finally {
        setLoading(false);
      }
    };
    if (leadId && authToken && changeLogService) fetchLogs();
  }, [leadId, authToken, changeLogService, refreshKey]);

  // Listen for optimistic remark updates so we can show the new log entry immediately
  useEffect(() => {
    const onRemarkUpdated = (e) => {
      try {
        const { id, remarks } = e?.detail || {};
        // match by backend id or fallback to provided leadId
        if (!id || String(id) !== String(leadId)) return;

        const now = new Date().toISOString();
        const synthetic = {
          id: `local-${Date.now()}`,
          timestamp: now,
          changed_by_name: "You",
          field_changed: "remarks",
          old_value: null,
          new_value: remarks,
          description: `Remarks updated.`,
          // mark it so we can filter/replace later
          __synthetic: true,
        };

        // Keep a short-lived cache of synthetic entries to reconcile with server logs
        syntheticRef.current = [
          synthetic,
          ...(syntheticRef.current || []),
        ].slice(0, 3);
        setLogs((prev) => [synthetic, ...(prev || [])]);
      } catch (err) {
        console.warn("LeadLogDisplay: failed to handle crm:remarkUpdated", err);
      }
    };

    window.addEventListener("crm:remarkUpdated", onRemarkUpdated);
    return () =>
      window.removeEventListener("crm:remarkUpdated", onRemarkUpdated);
  }, [leadId]);

  const toggleExpansion = useCallback(() => setIsExpanded((p) => !p), []);

  const getLogEntryClasses = (changedByName) => {
    const name = (changedByName || "").toLowerCase();
    switch (name) {
      case "admin":
        return "bg-green-50 text-green-800 border-green-200";
      case "superadmin":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "sales_rep":
        return "bg-purple-50 text-purple-800 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatLogEntry = (log) => {
    const timestamp = formatTimestamp(log.timestamp);
    let descriptionText = log.description;

    if (!descriptionText && log.field_changed) {
      if (log.field_changed === "remarks") {
        descriptionText = `Remarks updated.`;
      } else if (log.field_changed === "status") {
        descriptionText = `Status changed to '${log.new_value}'.`;
      } else if (log.field_changed === "last_call")
        descriptionText = `Last Call changed from '${getFormattedDate(
          log.old_value
        )}' to '${getFormattedDate(log.new_value)}'.`;
      else if (log.field_changed === "next_call")
        descriptionText = `Next Call changed from '${getFormattedDate(
          log.old_value
        )}' to '${getFormattedDate(log.new_value)}'.`;
      else if (log.field_changed === "age")
        descriptionText = `Age changed from '${log.old_value}' to '${log.new_value}'.`;
      else if (log.field_changed === "grade")
        descriptionText = `Grade changed from '${log.old_value}' to '${log.new_value}'.`;
      else
        descriptionText = `${log.field_changed} changed from '${log.old_value}' to '${log.new_value}'.`;
    } else if (!descriptionText)
      descriptionText = "No specific description available.";

    return `${
      log.changed_by_name || "System"
    } at ${timestamp}: ${descriptionText}`;
  };

  if (loading)
    return <div className="text-gray-500 text-xs">Loading logs...</div>;
  if (error) return <div className="text-red-500 text-xs">Error: {error}</div>;
  if (!logs.length)
    return <div className="text-gray-500 text-xs">No log entries.</div>;

  // Change here to display only one log entry by default
  const logsToDisplay = isExpanded ? logs : logs.slice(0, 1);
  const hasMoreLogs = logs.length > 1;

  return (
    <div
      className="whitespace-pre-wrap max-h-20 overflow-y-auto text-xs"
      style={{ minWidth: "200px" }}
    >
      {logsToDisplay.map((log) => {
        const entryText = formatLogEntry(log);
        return (
          <div
            key={log.id}
            className={`mb-1 last:mb-0 p-1 rounded-sm border ${getLogEntryClasses(
              log.changed_by_name
            )}`}
            title={entryText} // Add a title for hover text
          >
            {entryText}
          </div>
        );
      })}
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

export default LeadLogDisplay;
