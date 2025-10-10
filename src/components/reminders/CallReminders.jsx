import React, { useEffect, useMemo, useState } from "react";

// A lightweight date formatter. Returns YYYY-MM-DD or "" if invalid.
const toYMD = (d) => {
  try {
    if (!d) return "";
    // support 'YYYY-MM-DD', timestamps, ISO strings
    const s = String(d);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

const todayYMD = () => toYMD(new Date());

// Local persistence of reminder statuses per user and date.
// Structure in localStorage:
// key = mcc:reminders:{username}
// value = { [date]: { [leadId]: 'completed'|'pending' } }
const loadReminderMap = (username) => {
  try {
    const raw = localStorage.getItem(`mcc:reminders:${username || "anon"}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveReminderMap = (username, map) => {
  try {
    localStorage.setItem(
      `mcc:reminders:${username || "anon"}`,
      JSON.stringify(map || {})
    );
  } catch {}
};

// Small inline calendar icon
const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 6.75h15a1.5 1.5 0 011.5 1.5v9.75A2.25 2.25 0 0118.75 20.25H5.25A2.25 2.25 0 013 18V8.25a1.5 1.5 0 011.5-1.5z"
    />
  </svg>
);

// Column definition helper
const defaultColumns = {
  student_name: { label: "Student", visible: true },
  phone_number: { label: "Phone", visible: true },
  whatsapp_number: { label: "WhatsApp", visible: false },
  course_name: { label: "Course", visible: true },
  next_call: { label: "Next Call", visible: true },
  assigned_to_username: { label: "Assigned To", visible: true },
  status: { label: "Status", visible: true },
  sub_status: { label: "Sub Status", visible: false },
};

const ColumnToggler = ({ columns, setColumns }) => (
  <div className="flex flex-col gap-2 p-2 w-56">
    {Object.entries(columns).map(([key, cfg]) => (
      <label key={key} className="inline-flex items-center justify-between text-sm">
        <span className="text-gray-700">{cfg.label}</span>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={!!cfg.visible}
          onChange={() =>
            setColumns((prev) => ({
              ...prev,
              [key]: { ...prev[key], visible: !prev[key].visible },
            }))
          }
        />
      </label>
    ))}
  </div>
);

const CallReminders = ({ leads = [], currentUser = {}, isAdminLike = false }) => {
  const username = (currentUser?.username || currentUser?.name || "").toString();
  const [selectedDate, setSelectedDate] = useState(todayYMD());
  const [expanded, setExpanded] = useState(false);
  const [assignedFilter, setAssignedFilter] = useState("ALL");
  const [columns, setColumns] = useState(defaultColumns);
  const [selectAll, setSelectAll] = useState(false);
  const [showCols, setShowCols] = useState(false);

  // Local reminder map persisted per user
  const [reminderMap, setReminderMap] = useState(() => loadReminderMap(username));
  useEffect(() => saveReminderMap(username, reminderMap), [username, reminderMap]);

  // Build a list of leads visible to the current user
  const visibleLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    const list = leads.filter((l) => !!toYMD(l?.next_call));
    if (isAdminLike) {
      if (assignedFilter && assignedFilter !== "ALL") {
        return list.filter(
          (l) =>
            (l.assigned_to_username || l.assigned_to || "").toString() ===
            assignedFilter
        );
      }
      return list;
    }
    // Non-admin: only their leads (relaxed matching by username/email/name/id)
    const norm = (v) =>
      (v == null ? "" : String(v))
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    const usernameNorm = norm(username);
    // If username looks like an email, also try local-part before '@'
    const emailLocal = usernameNorm.includes("@")
      ? usernameNorm.split("@")[0]
      : usernameNorm;
    const userIdNorm = norm(currentUser?.id);
    const nameNorm = norm(currentUser?.name || currentUser?.full_name);

    return list.filter((l) => {
      const a = norm(l.assigned_to);
      const u = norm(l.assigned_to_username);
      // Accept any of the user identifiers to match any assigned field
      return (
        a === usernameNorm ||
        u === usernameNorm ||
        a === emailLocal ||
        u === emailLocal ||
        (userIdNorm && (a === userIdNorm || u === userIdNorm)) ||
        (nameNorm && (a === nameNorm || u === nameNorm))
      );
    });
  }, [leads, username, isAdminLike, assignedFilter]);

  // Unique assigned_to options for admin filter
  const assignedOptions = useMemo(() => {
    const set = new Set();
    visibleLeads.forEach((l) => {
      const v = (l.assigned_to_username || l.assigned_to || "").toString();
      if (v) set.add(v);
    });
    return ["ALL", ...Array.from(set)];
  }, [visibleLeads]);

  // Leads for selected date
  const dateLeads = useMemo(() => {
    const tgt = selectedDate;
    return visibleLeads.filter((l) => toYMD(l.next_call) === tgt);
  }, [visibleLeads, selectedDate]);

  // Reminder status helpers
  const getStatus = (leadId) => {
    const dmap = reminderMap[selectedDate] || {};
    return dmap[leadId] || "pending"; // default Pending
  };

  const setStatus = (leadId, status) => {
    setReminderMap((prev) => {
      const next = { ...prev };
      const d = { ...(next[selectedDate] || {}) };
      d[leadId] = status;
      next[selectedDate] = d;
      return next;
    });
  };

  const allSelectedIds = useMemo(
    () => dateLeads.map((l, i) => l._id || l.id || `lead-${i}`),
    [dateLeads]
  );

  const pendingCount = useMemo(
    () => allSelectedIds.reduce((acc, id) => acc + (getStatus(id) !== "completed" ? 1 : 0), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reminderMap, selectedDate, dateLeads]
  );

  useEffect(() => {
    // Keep the selectAll checkbox in sync: checked only if all completed
    const allCompleted = allSelectedIds.length > 0 && allSelectedIds.every((id) => getStatus(id) === "completed");
    setSelectAll(allCompleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderMap, selectedDate, dateLeads]);

  const toggleSelectAll = (checked) => {
    setSelectAll(checked);
    const status = checked ? "completed" : "pending";
    setReminderMap((prev) => {
      const next = { ...prev };
      const d = { ...(next[selectedDate] || {}) };
      allSelectedIds.forEach((id) => (d[id] = status));
      next[selectedDate] = d;
      return next;
    });
  };

  const visibleColumns = Object.entries(columns).filter(([, cfg]) => cfg.visible);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><CalendarIcon className="w-5 h-5" /></div>
          <div>
            <div className="text-base md:text-lg font-semibold text-gray-900">Call reminders</div>
            <div className="text-xs md:text-sm text-gray-500">Follow up with your leads on their next call date</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700"
            onClick={() => setSelectedDate(todayYMD())}
          >
            Today
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span className="hidden sm:inline">Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          {isAdminLike && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span className="hidden sm:inline">Assigned To</span>
              <select
                className="border rounded-md px-2 py-1.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
              >
                {assignedOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "ALL" ? "All" : opt}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCols((v) => !v)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700"
              aria-haspopup="true"
              aria-expanded={showCols}
            >
              Columns
            </button>
            {showCols && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <ColumnToggler columns={columns} setColumns={setColumns} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary/Actions */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-700">
          On <span className="font-medium text-gray-900">{selectedDate}</span>,
          <button
            className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            onClick={() => setExpanded((v) => !v)}
          >
            {pendingCount} pending
          </button>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {Math.max(allSelectedIds.length - pendingCount, 0)} completed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-1.5 text-xs md:text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            aria-expanded={expanded}
            aria-controls="call-reminders-table"
            title={expanded ? "Hide table" : "Show table"}
          >
            {expanded ? "Close table" : "Show table"}
          </button>
          <button
            type="button"
            onClick={() => toggleSelectAll(false)}
            className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Mark all Pending
          </button>
          <button
            type="button"
            onClick={() => toggleSelectAll(true)}
            className="px-3 py-1.5 text-xs md:text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Mark all Completed
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4" id="call-reminders-table">
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <label className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectAll}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                      <span>Mark all completed</span>
                    </label>
                  </th>
                  {visibleColumns.map(([key, cfg]) => (
                    <th key={key} className="px-3 py-2 text-left text-[11px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {cfg.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-[11px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider">Reminder</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {dateLeads.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-sm text-gray-500 text-center" colSpan={visibleColumns.length + 2}>
                      No leads for this date.
                    </td>
                  </tr>
                )}
                {dateLeads.map((lead, idx) => {
                  const id = lead._id || lead.id || `lead-${idx}`;
                  const status = getStatus(id);
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={status === "completed"}
                          onChange={(e) => setStatus(id, e.target.checked ? "completed" : "pending")}
                          aria-label="Mark completed"
                        />
                      </td>
                      {visibleColumns.map(([key]) => {
                        const val = String(lead?.[key] ?? "").toString();
                        const isPhone = key === "phone_number" && val;
                        return (
                          <td key={key} className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">
                            {isPhone ? (
                              <a href={`tel:${val}`} className="text-blue-600 hover:text-blue-700 underline underline-offset-2">
                                {val}
                              </a>
                            ) : (
                              val
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <span
                          className={
                            status === "completed"
                              ? "inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700"
                              : "inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700"
                          }
                        >
                          {status === "completed" ? "Completed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallReminders;
