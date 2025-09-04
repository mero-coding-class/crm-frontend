import React, { useState, useEffect, useCallback } from "react";
// Local helper: safely format to YYYY-MM-DD (for display in messages)
const getFormattedDate = (dateString) => {
  try {
    if (!dateString || dateString === "N/A") return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};
// Local helper: readable timestamp
const formatTimestamp = (timestampString) => {
  if (!timestampString) return "N/A";
  try {
    const date = new Date(timestampString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString();
  } catch {
    return "Error Date";
  }
};
const LeadLogDisplay = ({
  leadId,
  authToken,
  changeLogService,
  logs: logsProp, // optional — parent can pass logs
  refreshKey, // optional — causes a refetch when this changes
}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  // Normalize payload in case backend returns [] or { results: [] }
  const normalizeLogs = useCallback((payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.results && Array.isArray(payload.results))
      return payload.results;
    return [];
  }, []);
  // Use parent-provided logs first (if any)
  useEffect(() => {
    if (logsProp && (Array.isArray(logsProp) || logsProp.results)) {
      const normalized = normalizeLogs(logsProp).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setLogs(normalized);
      setLoading(false);
      setError(null);
    }
  }, [logsProp, normalizeLogs]);
  // Otherwise fetch from service (and refetch on refreshKey)
  useEffect(() => {
    const shouldFetch = !logsProp || normalizeLogs(logsProp).length === 0;
    if (!leadId || !authToken || !changeLogService || !shouldFetch) return;
    let isActive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const fetched = await changeLogService.getLeadLogs(leadId, authToken);
        if (!isActive) return;
        const normalized = normalizeLogs(fetched).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setLogs(normalized);
      } catch (err) {
        if (!isActive) return;
        console.error("Error fetching logs for lead", leadId, err);
        setError(err?.message || "Failed to fetch logs.");
      } finally {
        if (isActive) setLoading(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [
    leadId,
    authToken,
    changeLogService,
    refreshKey,
    logsProp,
    normalizeLogs,
  ]);
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
  const formatEntry = (log) => {
    const who = log.changed_by_name || "System";
    const when = formatTimestamp(log.timestamp);
    let what = log.description;
    if (!what && log.field_changed !== undefined) {
      const oldV = log.old_value;
      const newV = log.new_value;
      switch (log.field_changed) {
        case "status":
          what = `Status changed from '${oldV}' to '${newV}'.`;
          break;
        case "remarks":
          what = "Remarks updated.";
          break;
        case "last_call":
          what = `Last Call date changed from '${getFormattedDate(
            oldV
          )}' to '${getFormattedDate(newV)}'.`;
          break;
        case "next_call":
          what = `Next Call date changed from '${getFormattedDate(
            oldV
          )}' to '${getFormattedDate(newV)}'.`;
          break;
        case "age":
          what = `Age changed from '${oldV}' to '${newV}'.`;
          break;
        case "grade":
          what = `Grade changed from '${oldV}' to '${newV}'.`;
          break;
        default:
          what = `${log.field_changed} changed from '${oldV}' to '${newV}'.`;
      }
    }
    if (!what) what = "No specific description available.";
    return `${who} at ${when}: ${what}`;
  };
  if (loading)
    return <div className="text-gray-500 text-xs">Loading logs...</div>;
  if (error) return <div className="text-red-500 text-xs">Error: {error}</div>;
  if (!logs || logs.length === 0)
    return <div className="text-gray-500 text-xs">No log entries.</div>;
  const toShow = isExpanded ? logs : logs.slice(0, 4);
  const hasMore = logs.length > 4;
  return (
    <div
      className="whitespace-pre-wrap max-h-28 overflow-y-auto text-xs"
      style={{ minWidth: 220 }}
    >
      {toShow.map((log) => (
        <div
          key={log.id ?? `${log.timestamp}-${log.changed_by_name ?? "system"}`}
          className={`mb-1 last:mb-0 p-1 rounded-sm border ${getLogEntryClasses(
            log.changed_by_name
          )}`}
        >
          {formatEntry(log)}
        </div>
      ))}
      {hasMore && (
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
