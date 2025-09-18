import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import LeadTableDisplay from "../components/LeadTableDisplay";
import LeadEditModal from "../components/LeadEditModal";
import AddLeadModal from "../components/AddLeadModal";
import ImportCsvButton from "../components/ImportCsvButton";
import Toast from "../components/common/Toast";
import scheduleBackground from "../utils/backgroundScheduler";
import { BASE_URL } from "../config";
import DelayedLoader from "../components/common/DelayedLoader";
import { useLeadSearch } from "../hooks/useLeadSearch";
import { useLeadUpdates } from "../hooks/useLeadUpdates";
import {
  leadService,
  courseService,
  enrollmentService,
  changeLogService,
} from "../services/api";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const Leads = () => {
  const { authToken, user } = useAuth();

  // Core state declarations
  const [allLeads, setAllLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  // Fetch users for Assigned To dropdown (inside component so hooks are initialized)
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch(
          "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/users/",
          {
            headers: { Authorization: `Token ${authToken}` },
            credentials: "include",
          }
        );
        if (!res.ok) {
          console.warn("Failed to fetch users", res.status);
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        const normalized = (list || []).map((u) => ({
          id: u?.id ?? null,
          username: u?.username ?? (u?.email ? u.email.split("@")[0] : null),
          name: u?.name ?? u?.username ?? u?.email ?? String(u?.id ?? ""),
          email: u?.email ?? "",
          raw: u,
        }));
        if (!cancelled) setUsers(normalized);
      } catch (err) {
        console.error("Error fetching users", err);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [authToken]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAge, setFilterAge] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("Class");
  const [filterShift, setFilterShift] = useState("Shift");
  const [filterDevice, setFilterDevice] = useState("Device");
  const [filterSubStatus, setFilterSubStatus] = useState("SubStatus");
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("CodingExp");

  // Refs
  const leadsOrderRef = React.useRef([]);

  // Use our custom hooks for search and updates
  const {
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    filteredLeads,
    displayedLeads,
    totalPages,
  } = useLeadSearch(allLeads, 20);

  const {
    updateLead,
    bulkUpdate,
    updating,
    errors: updateErrors,
    clearError,
  } = useLeadUpdates(
    authToken,
    (leadId, updates) => {
      // ...existing code...
    },
    (error) => {
      // ...existing code...
    }
  );

  // Always recalculate filters on latest allLeads
  useEffect(() => {
    let filtered = [...allLeads];
    if (filterStatus && filterStatus !== "All") {
      filtered = filtered.filter(
        (lead) => (lead.status || "") === filterStatus
      );
    }
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          (lead.student_name && lead.student_name.toLowerCase().includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          (lead.phone_number && lead.phone_number.toLowerCase().includes(q))
      );
    }
    if (filterAge && filterAge.trim()) {
      filtered = filtered.filter(
        (lead) => lead.age && lead.age.toString().includes(filterAge.trim())
      );
    }
    if (filterGrade && filterGrade.trim()) {
      filtered = filtered.filter(
        (lead) =>
          lead.grade && lead.grade.toString().includes(filterGrade.trim())
      );
    }
    if (filterLastCall && filterLastCall.trim()) {
      filtered = filtered.filter((lead) => {
        const val = lead.last_call || lead.recentCall || "";
        return val === filterLastCall.trim();
      });
    }
    if (filterClassType && filterClassType !== "Class") {
      filtered = filtered.filter(
        (lead) => (lead.class_type || "") === filterClassType
      );
    }
    if (filterShift && filterShift !== "Shift") {
      filtered = filtered.filter((lead) => (lead.shift || "") === filterShift);
    }
    if (filterDevice && filterDevice !== "Device") {
      filtered = filtered.filter(
        (lead) => (lead.device || "") === filterDevice
      );
    }
    if (filterSubStatus && filterSubStatus !== "SubStatus") {
      filtered = filtered.filter(
        (lead) => (lead.sub_status || lead.substatus || "") === filterSubStatus
      );
    }
    if (filterPrevCodingExp && filterPrevCodingExp !== "CodingExp") {
      filtered = filtered.filter(
        (lead) =>
          (lead.previous_coding_experience || "") === filterPrevCodingExp
      );
    }
    setLeads(filtered);
  }, [
    allLeads,
    filterStatus,
    searchTerm,
    filterAge,
    filterGrade,
    filterLastCall,
    filterClassType,
    filterShift,
    filterDevice,
    filterSubStatus,
    filterPrevCodingExp,
  ]);

  // Fetch courses once when authToken is available so AddLeadModal receives
  // the `courses` array (backend objects with `course_name`). Previously
  // courses were only set by a manual `handleRefresh` path; ensure we
  // proactively load them so the AddLeadModal dropdown is populated.
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    const fetchCourses = async () => {
      try {
        const res = await courseService.getCourses(authToken);
        const list = Array.isArray(res) ? res : res?.results || [];
        if (!cancelled) setCourses(list);
        console.debug("Leads: fetched courses count=", list.length);
      } catch (err) {
        console.warn("Leads: failed to fetch courses", err);
        if (!cancelled) setCourses([]);
      }
    };
    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const statusOptions = ["All", "Active", "Converted", "Lost"];

  const ensureLeadIds = (arr) =>
    (Array.isArray(arr) ? arr : []).map((lead, i) => ({
      ...lead,
      _id:
        lead._id || lead.id || lead.email || lead.phone_number || `lead-${i}`,
      // normalize common variants
      sub_status: lead.sub_status || lead.substatus || "New",
      assigned_to:
        lead.assigned_to || lead.assigned_to_username || lead.assigned_to || "",
      assigned_to_username: lead.assigned_to_username || lead.assigned_to || "",
    }));

  const classTypeOptions = ["Class", "Online", "Physical"];
  const subStatusOptions = [
    "SubStatus",
    "New",
    "Open",
    "Followup",
    "inProgress",
    "Average",
    "Interested",
    "Junk",
  ];
  const shiftOptions = [
    "Shift",
    "7 A.M. - 9 A.M.",
    "8 A.M. - 10 A.M.",
    "10 A.M. - 12 P.M.",
    "11 A.M. - 1 P.M.",
    "12 P.M. - 2 P.M.",
    "2 P.M. - 4 P.M.",
    "2:30 P.M. - 4:30 P.M.",
    "4 P.M. - 6 P.M.",
    "4:30 P.M. - 6:30 P.M.",
    "5 P.M. - 7 P.M.",
    "6 P.M. - 7 P.M.",
    "6 P.M. - 8 P.M.",
    "7 P.P. - 8 P.M.",
  ];
  const deviceOptions = ["Device", "Yes", "No"];
  const previousCodingExpOptions = [
    "CodingExp",
    "None",
    "Basic Python",
    "Intermediate C++",
    "Arduino",
    "Some Linux",
    "Advanced Python",
    "Basic Java",
    "Other",
  ];

  const handleRefresh = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const [leadsData, coursesData] = await Promise.all([
        leadService.getLeads(authToken),
        courseService.getCourses(authToken),
      ]);

      const processedLeads = (
        Array.isArray(leadsData) ? leadsData : leadsData.results || []
      )
        .map((lead) => ({
          ...lead,
          sub_status: lead.sub_status || lead.substatus || "New",
          assigned_to:
            lead.assigned_to ||
            lead.assigned_to_username ||
            lead.assigned_to ||
            "",
          assigned_to_username:
            lead.assigned_to_username || lead.assigned_to || "",
          course_name: lead.course_name || "N/A",
          course_duration: lead.course_duration || "",
        }))
        .slice(0, pageSize);

      setAllLeads(processedLeads);
      // Normalize coursesData
      if (
        coursesData &&
        !Array.isArray(coursesData) &&
        Array.isArray(coursesData.results)
      ) {
        setCourses(coursesData.results);
        console.debug(
          "Leads: setCourses from handleRefresh (results)",
          coursesData.results
        );
      } else {
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        console.debug(
          "Leads: setCourses from handleRefresh (array)",
          Array.isArray(coursesData) ? coursesData.length : 0,
          coursesData
        );
      }
    } catch (err) {
      setError(err.message || "Failed to refresh leads");
    } finally {
      setLoading(false);
    }
  }, [authToken, pageSize]);

  // Server-driven pagination: fetch page when currentPage changes
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    const baseUrl = `${BASE_URL}/leads/`;

    const fetchPage = async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const url = `${baseUrl}?page=${page}&page_size=${pageSize}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });
        if (!resp.ok) throw new Error(`Failed to fetch leads: ${resp.status}`);
        const json = await resp.json();
        let list = [];
        let count = null;
        if (Array.isArray(json)) {
          list = json;
          count = json.length;
        } else if (Array.isArray(json.results)) {
          list = json.results;
          count = json.count ?? null;
        } else {
          list = json.data || [];
          count = json.count ?? null;
        }
        if (!cancelled) {
          const normalized = ensureLeadIds(list || []);

          // If we have a remembered order, preserve it where possible
          const prevOrder = leadsOrderRef.current || [];
          if (prevOrder && prevOrder.length) {
            const byId = new Map(
              normalized.map((l) => [String(l.id || l._id || ""), l])
            );
            const ordered = [];
            for (const pid of prevOrder) {
              const item = byId.get(String(pid));
              if (item) ordered.push(item);
            }
            // Append any server items not in the previous ordering
            const appended = normalized.filter(
              (l) => !prevOrder.includes(String(l.id || l._id || ""))
            );
            setAllLeads([...ordered, ...appended]);
          } else {
            setAllLeads(normalized);
          }
          setTotalCount(count);
          // Note: totalPages is now handled by useLeadSearch hook
          // Debug: log courses state when page fetch completes
          try {
            console.debug(
              "Leads: page fetch completed, current courses length:",
              courses.length
            );
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load leads");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPage(currentPage);
    return () => {
      cancelled = true;
    };
  }, [authToken, currentPage, pageSize]);

  useEffect(() => {
    console.log("Current page:", currentPage, "Total pages:", totalPages);
  }, [currentPage, totalPages]);

  // Keep the ordering ref up to date whenever visible leads change.
  useEffect(() => {
    try {
      leadsOrderRef.current = (allLeads || []).map((l) =>
        String(l.id || l._id || "")
      );
    } catch (e) {
      leadsOrderRef.current = [];
    }
  }, [allLeads]);

  // listen for global import events and other runtime events (in their own effect)

  useEffect(() => {
    if (!authToken) return;
    const importDebounceRef = { current: null };
    const onImported = (e) => {
      console.info("Leads.jsx detected crm:imported event, scheduling refresh");
      if (importDebounceRef.current) clearTimeout(importDebounceRef.current);
      importDebounceRef.current = setTimeout(() => {
        handleRefresh();
        importDebounceRef.current = null;
      }, 700);
    };
    window.addEventListener("crm:imported", onImported);

    const onLeadUpdated = (e) => {
      try {
        const updated = e?.detail?.lead;
        if (!updated) return;
        setAllLeads((prev) => {
          const matchIndex = prev.findIndex(
            (l) =>
              l.id === updated.id ||
              String(l._id) === String(updated.id) ||
              l.email === updated.email ||
              l.phone_number === updated.phone_number
          );
          if (matchIndex === -1) return prev;
          const next = [...prev];
          next[matchIndex] = { ...next[matchIndex], ...updated };
          return next;
        });
      } catch (err) {
        console.warn("Leads.jsx could not apply crm:leadUpdated event", err);
      }
    };
    window.addEventListener("crm:leadUpdated", onLeadUpdated);

    const onLeadRestored = (e) => {
      try {
        const restored = e?.detail?.lead;
        if (!restored) return;
        setAllLeads((prev) => {
          const filtered = (prev || []).filter(
            (l) =>
              !(l.id === restored.id || String(l._id) === String(restored.id))
          );
          const withId = {
            ...restored,
            _id: restored._id || restored.id || `lead-${Date.now()}`,
          };
          return [withId, ...filtered];
        });
      } catch (err) {
        console.warn("Failed to apply crm:leadRestored event", err);
      }
    };
    window.addEventListener("crm:leadRestored", onLeadRestored);

    const onEnrollmentCreated = (e) => {
      try {
        const enrollment = e?.detail?.enrollment;
        if (!enrollment) return;
        const leadId =
          enrollment.lead?.id || enrollment.lead || enrollment.student || null;
        if (leadId) {
          setAllLeads((prev) => {
            const foundIndex = (prev || []).findIndex(
              (l) => l.id === leadId || String(l._id) === String(leadId)
            );
            if (foundIndex === -1) return prev;
            const next = [...prev];
            const [item] = next.splice(foundIndex, 1);
            return [item, ...next];
          });
        }
      } catch (err) {
        console.warn("Failed to handle crm:enrollmentCreated event", err);
      }
    };
    window.addEventListener("crm:enrollmentCreated", onEnrollmentCreated);

    return () => {
      window.removeEventListener("crm:imported", onImported);
      window.removeEventListener("crm:leadUpdated", onLeadUpdated);
      window.removeEventListener("crm:leadRestored", onLeadRestored);
      window.removeEventListener("crm:enrollmentCreated", onEnrollmentCreated);
      if (importDebounceRef.current) clearTimeout(importDebounceRef.current);
    };
  }, [authToken, handleRefresh]);

  const handleOpenAddModal = useCallback(() => setIsAddModalOpen(true), []);
  const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);

  const handleAddNewLead = useCallback(
    async (newLeadData) => {
      try {
        // Create a complete lead object with all required fields
        const formattedLead = {
          ...newLeadData,
          _id:
            newLeadData.id?.toString() ||
            newLeadData._id ||
            `new-${Date.now()}`,
          // Ensure both id and _id are set correctly
          id: newLeadData.id || parseInt(newLeadData._id) || null,
          // Snake case fields (for API)
          student_name: newLeadData.student_name?.trim() || "",
          parents_name: newLeadData.parents_name?.trim() || "",
          phone_number: newLeadData.phone_number?.trim() || "",
          whatsapp_number: newLeadData.whatsapp_number?.trim() || "",
          email: newLeadData.email || "",
          age: newLeadData.age || "",
          grade: newLeadData.grade || "",
          source: newLeadData.source || "",
          // Ensure course_name is preserved
          course_name: newLeadData.course_name || "",
          status: newLeadData.status || "New",
          // Camel case fields (for display)
          studentName: newLeadData.student_name?.trim() || "",
          parentsName: newLeadData.parents_name?.trim() || "",
          phone: newLeadData.phone_number?.trim() || "",
          contactWhatsapp: newLeadData.whatsapp_number?.trim() || "",
          created_at: newLeadData.created_at || new Date().toISOString(),
          updated_at: newLeadData.updated_at || new Date().toISOString(),
          logs_url: newLeadData.logs_url || null,
          change_logs: [
            {
              action: "Created",
              timestamp: new Date().toISOString(),
              changes: "New lead created",
              user: "System",
            },
          ],
        };

        // Add lead at the beginning and ensure no duplicates
        setAllLeads((prevLeads) => {
          const existingLeadIndex = prevLeads.findIndex(
            (lead) =>
              lead._id === formattedLead._id ||
              (lead.phone_number === formattedLead.phone_number &&
                lead.student_name === formattedLead.student_name)
          );

          if (existingLeadIndex !== -1) {
            // Replace existing lead
            const updatedLeads = [...prevLeads];
            updatedLeads[existingLeadIndex] = formattedLead;
            return updatedLeads;
          }

          // Add new lead at the beginning
          return [formattedLead, ...prevLeads];
        });

        // Show success message
        setToast({
          show: true,
          message: `New lead added: ${formattedLead.student_name}`,
          type: "success",
        });

        // Handle special cases after UI update
        if (newLeadData.status === "Converted") {
          // Backend expects PATCH to enrollments endpoint (no POST).
          // Use backend id when available.
          const serverId = newLeadData.id || newLeadData._id;
          try {
            const resp = await fetch(`${BASE_URL}/enrollments/${serverId}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
              },
              body: JSON.stringify(newLeadData),
            });
            if (!resp.ok) {
              console.warn(
                "Enrollment PATCH failed for new lead:",
                await resp.text()
              );
            }
          } catch (e) {
            console.warn("Enrollment PATCH request failed:", e);
          }
        } else if (newLeadData.status === "Lost") {
          // Backend accepts updating a lead to 'Lost' via updateLead.
          try {
            // Try PATCHing the trash endpoint for this lead (backend accepts PATCH)
            const serverId = newLeadData.id || newLeadData._id;
            const resp = await fetch(`${BASE_URL}/trash/${serverId}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
              },
              body: JSON.stringify({ status: "Lost" }),
            });
            if (!resp.ok) {
              // Fallback to updating the lead status if trash endpoint rejects
              console.warn(
                "Trash PATCH failed for new lead, falling back to lead update:",
                await resp.text()
              );
              await leadService.updateLead(
                serverId,
                { status: "Lost" },
                authToken
              );
            }
          } catch (e) {
            console.warn("Failed to mark newly created lead as Lost:", e);
          }
        }

        // Update filters and close modal
        setSearchTerm("");
        setFilterStatus("Active");
        handleCloseAddModal();
      } catch (error) {
        console.error("Error adding lead:", error);
        // Remove the failed lead if there was an error
        setAllLeads((prevLeads) =>
          prevLeads.filter((lead) => lead._id !== newLeadData._id)
        );
        alert("Failed to add lead. Please try again.");
      }
    },
    [authToken, handleCloseAddModal]
  );
  const handleEdit = useCallback((lead) => {
    setEditingLead(lead);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingLead(null);
  }, []);

  // Save edits: send camelCase object; map course name -> id if needed
  const handleSaveEdit = useCallback(
    async (updatedLead) => {
      // optimistic update: apply changes locally first
      const prevLeadsSnapshot = (allLeads || []).slice();
      try {
        // Optimistic update: match lead by backend `id` or UI `_id` (normalize both)
        setAllLeads((prev) =>
          prev.map((l) =>
            String(l.id || l._id || "") ===
            String(updatedLead.id || updatedLead._id || "")
              ? { ...l, ...updatedLead }
              : l
          )
        );

        let payload = { ...updatedLead };
        // Backend accepts only a small set of top-level statuses. If the UI
        // provides a different value (e.g., a sub-status like 'Interested'),
        // move it into substatus so we don't send an invalid `status` value.
        const allowedTopStatuses = ["Active", "Converted", "Lost"];
        if (payload.status !== undefined) {
          if (!allowedTopStatuses.includes(payload.status)) {
            // move to substatus and remove top-level status
            payload.substatus = payload.status;
            payload.sub_status = payload.status;
            delete payload.status;
          }
        }
        // If assigned_to is present, also set assigned_to_username so backend
        // receives the username field consistently.
        if (
          payload.assigned_to !== undefined &&
          !payload.assigned_to_username
        ) {
          payload.assigned_to_username = payload.assigned_to;
        }
        // Ensure both substatus naming variants are present when saving from modal
        if (
          payload.substatus !== undefined &&
          payload.sub_status === undefined
        ) {
          payload.sub_status = payload.substatus;
        }
        if (updatedLead.course != null) {
          const selected = courses.find(
            (c) =>
              c.course_name === updatedLead.course ||
              String(c.id) === String(updatedLead.course)
          );
          payload.course = selected ? selected.id : updatedLead.course;
        }

        // If payload.course is a numeric string, coerce to number (backend expects pk)
        if (
          payload.course !== undefined &&
          typeof payload.course === "string" &&
          /^\d+$/.test(payload.course)
        ) {
          payload.course = parseInt(payload.course, 10);
        }

        // Always use backend id for PATCH requests. Match by normalized string
        // form of _id to avoid type mismatches (server id may be number).
        // Find the existing lead in our snapshot by trying several id variants
        const existing =
          prevLeadsSnapshot.find((l) => {
            const lhs = String(l.id || l._id || "");
            const rhs = String(updatedLead.id || updatedLead._id || "");
            return lhs && rhs && lhs === rhs;
          }) || {};

        // If we don't have an explicit backend id, try to resolve it from
        // other common fields (id, email, phone_number). As a last resort
        // use updatedLead.id if provided. This makes saving edits from the
        // modal resilient when the modal supplies only a display _id.
        let serverId = existing.id || updatedLead.id || updatedLead._id || null;

        // If serverId looks like the display _id (e.g., "lead-..."), attempt
        // to fall back to matching prevLeadsSnapshot by email/phone to find
        // the real backend id.
        if (
          serverId &&
          typeof serverId === "string" &&
          serverId.startsWith("lead-")
        ) {
          const match = prevLeadsSnapshot.find(
            (l) =>
              l.email === updatedLead.email ||
              l.phone_number === updatedLead.phone_number ||
              l.phone === updatedLead.phone ||
              l.id === updatedLead.id
          );
          if (match && match.id) serverId = match.id;
        }

        if (!serverId) {
          // Still cannot determine server id — throw a helpful error so the
          // caller can handle it (and we don't attempt a blind PATCH).
          throw new Error("Cannot update: backend lead id missing");
        }

        // Call API and merge server response into local state so UI matches backend
        const serverResp = await leadService.updateLead(
          serverId,
          payload,
          authToken
        );

        setAllLeads((prev) =>
          prev.map((l) =>
            String(l.id || l._id || "") ===
            String(updatedLead.id || updatedLead._id || "")
              ? {
                  // merge fields returned by server, prefer server values
                  ...l,
                  ...serverResp,
                  // ensure stable _id remains available to UI
                  _id: serverResp._id || serverResp.id || l._id,
                }
              : l
          )
        );

        handleCloseEditModal();
      } catch (err) {
        // rollback optimistic update
        setAllLeads(prevLeadsSnapshot);
        console.error("Failed to save edit:", err);
        setToast({
          show: true,
          message: err.message || "Failed to update lead",
          type: "error",
        });
      }
    },
    [authToken, courses, handleCloseEditModal]
  );

  // Single-field update from table cells
  const updateLeadField = useCallback(
    async (leadId, fieldName, newValue) => {
      // Optimistic update: apply locally first, then call API.
      const prevLeads = (allLeads || []).slice();
      try {
        // First find the exact lead using the _id which is unique
        const leadObj = allLeads.find((l) => l._id === leadId);
        if (!leadObj) {
          setToast({
            show: true,
            message: "Cannot update: Lead not found.",
            type: "error",
          });
          return;
        }
        // Only use backend id for PATCH requests
        if (!leadObj.id) {
          setToast({
            show: true,
            message: "Cannot update: Lead not yet saved to backend.",
            type: "error",
          });
          return;
        }
        const serverId = leadObj.id;

        // Apply optimistic local change. Keep both naming variants in local
        // lead object so table rendering (which may read either) updates.
        if (
          fieldName === "status" &&
          (newValue === "Lost" || newValue === "Converted")
        ) {
          // remove locally for these statuses
          setAllLeads((prev) => prev.filter((l) => l._id !== leadId));
        } else {
          setAllLeads((prev) =>
            prev.map((lead) =>
              lead._id === leadId
                ? {
                    ...lead,
                    // keep both variants in sync
                    ...(fieldName === "substatus" || fieldName === "sub_status"
                      ? { substatus: newValue, sub_status: newValue }
                      : {}),
                    // handle assigned_to_username specifically
                    ...(fieldName === "assigned_to_username"
                      ? {
                          assigned_to_username: newValue,
                          assigned_to: newValue,
                        }
                      : {}),
                    // date fields should be stored in YYYY-MM-DD for UI
                    ...(fieldName === "last_call" || fieldName === "recentCall"
                      ? { recentCall: newValue, last_call: newValue }
                      : {}),
                    ...(fieldName === "next_call" || fieldName === "nextCall"
                      ? { nextCall: newValue, next_call: newValue }
                      : {}),
                    // default assignment for other fields
                    ...(fieldName !== "substatus" &&
                    fieldName !== "sub_status" &&
                    fieldName !== "last_call" &&
                    fieldName !== "recentCall" &&
                    fieldName !== "next_call" &&
                    fieldName !== "nextCall"
                      ? { [fieldName]: newValue }
                      : {}),
                  }
                : lead
            )
          );
        }

        // Map course name -> id on change
        let updatesToSend = { [fieldName]: newValue };
        if (fieldName === "course") {
          const selectedCourse = courses.find(
            (c) =>
              c.course_name === newValue || String(c.id) === String(newValue)
          );
          updatesToSend.course = selectedCourse ? selectedCourse.id : newValue;
          if (
            typeof updatesToSend.course === "string" &&
            /^\d+$/.test(updatesToSend.course)
          ) {
            updatesToSend.course = parseInt(updatesToSend.course, 10);
          }
        }

        // If a status-like value is being applied via inline edit, ensure
        // we only send allowed top-level statuses. Otherwise store it as a
        // substatus so backend doesn't reject it.
        if (fieldName === "status") {
          const allowedTopStatuses = ["Active", "Converted", "Lost"];
          if (!allowedTopStatuses.includes(newValue)) {
            updatesToSend = { substatus: newValue, sub_status: newValue };
          }
        }

        // When updating substatus directly ensure both variants are sent
        if (fieldName === "substatus" || fieldName === "sub_status") {
          updatesToSend = { substatus: newValue, sub_status: newValue };
        }

        // When updating assigned user, send both assigned_to and assigned_to_username
        if (fieldName === "assigned_to") {
          updatesToSend = {
            assigned_to: newValue,
            assigned_to_username: newValue,
          };
        }

        // Date fields: ensure we send camelCase or snake_case recognized by api.updateLead
        if (fieldName === "last_call" || fieldName === "recentCall") {
          updatesToSend = { recentCall: newValue };
        }
        if (fieldName === "next_call" || fieldName === "nextCall") {
          updatesToSend = { nextCall: newValue };
        }

        // Shift sanitization: only send if it matches allowed shift options
        if (fieldName === "shift") {
          const allowedShifts = [
            "7 A.M. - 9 A.M.",
            "8 A.M. - 10 A.M.",
            "10 A.M. - 12 P.M.",
            "11 A.M. - 1 P.M.",
            "12 P.M. - 2 P.M.",
            "2 P.M. - 4 P.M.",
            "2:30 P.M. - 4:30 P.M.",
            "4 P.M. - 6 P.M.",
            "4:30 P.M. - 6:30 P.M.",
            "5 P.M. - 7 P.M.",
            "6 P.M. - 7 P.M.",
            "6 P.M. - 8 P.M.",
            "7 P.M. - 8 P.M.",
          ];
          if (
            typeof newValue === "string" &&
            allowedShifts.includes(newValue.trim())
          ) {
            updatesToSend.shift = newValue.trim();
          } else {
            // omit shift if not in allowed list to avoid backend 400
            delete updatesToSend.shift;
          }
        }

        // Normalize date strings that may be in old backend format 'YYYY|DD|MM'
        const normalizePipeDateToIso = (val) => {
          if (!val) return val;
          if (typeof val !== "string") return val;
          if (val.includes("|")) {
            const p = val.split("|");
            if (p.length === 3) {
              const [yyyy, dd, mm] = p;
              return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
            }
          }
          return val;
        };
        if (updatesToSend.recentCall)
          updatesToSend.recentCall = normalizePipeDateToIso(
            updatesToSend.recentCall
          );
        if (updatesToSend.nextCall)
          updatesToSend.nextCall = normalizePipeDateToIso(
            updatesToSend.nextCall
          );

        // send update
        await leadService.updateLead(serverId, updatesToSend, authToken);
        // If course_duration was updated, refresh leads table
        if (fieldName === "course_duration") {
          if (typeof handleRefresh === "function") {
            await handleRefresh();
          }
        }

        // status side-effects (enrollment/trash) — run after successful PATCH
        if (fieldName === "status") {
          if (newValue === "Converted") {
            try {
              const leadObjAfter =
                prevLeads.find((l) => l._id === leadId) || {};
              const resolvedCourseId =
                leadObjAfter.course &&
                (typeof leadObjAfter.course === "number" ||
                  /^\d+$/.test(String(leadObjAfter.course)))
                  ? leadObjAfter.course
                  : leadObjAfter.course_name
                  ? (
                      courses.find(
                        (c) =>
                          (c.course_name || c.name || "").toString().trim() ===
                          String(leadObjAfter.course_name).trim()
                      ) || {}
                    ).id
                  : null;

              const enrollmentPayload = {
                lead: leadObjAfter.id || leadId,
                course: resolvedCourseId || null,
                total_payment: leadObjAfter.value || null,
                first_installment: null,
                second_installment: null,
                third_installment: null,
                batchname: "",
                last_pay_date: null,
                payment_completed: false,
                starting_date: null,
                assigned_teacher: "",
              };

              const serverIdAfter = leadObjAfter.id || leadId;
              const resp = await fetch(
                `${BASE_URL}/enrollments/${serverIdAfter}/`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                  },
                  body: JSON.stringify(enrollmentPayload),
                }
              );
              if (resp.ok) {
                const created = await resp.json();
                window.dispatchEvent(
                  new CustomEvent("crm:enrollmentCreated", {
                    detail: { enrollment: created },
                  })
                );
                window.dispatchEvent(
                  new CustomEvent("crm:leadConverted", {
                    detail: { leadId: leadId, enrollment: created },
                  })
                );
              } else {
                console.error("Enrollment PATCH failed:", await resp.text());
              }
            } catch (e) {
              console.error("Enrollment PATCH request failed:", e);
            }
          }

          if (newValue === "Lost") {
            try {
              const leadObjAfter =
                prevLeads.find((l) => l._id === leadId) || {};
              const serverIdAfter = leadObjAfter.id || leadId;
              const resp = await fetch(`${BASE_URL}/trash/${serverIdAfter}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify({ status: "Lost" }),
              });
              if (resp.ok) {
                const trashed = await resp.json();
                window.dispatchEvent(
                  new CustomEvent("crm:leadMovedToTrash", {
                    detail: { lead: trashed, leadId },
                  })
                );
              } else {
                console.warn("Trash PATCH failed:", await resp.text());
                window.dispatchEvent(
                  new CustomEvent("crm:leadMovedToTrash", {
                    detail: { leadId },
                  })
                );
              }
            } catch (e) {
              console.error("Trash PATCH request failed:", e);
              window.dispatchEvent(
                new CustomEvent("crm:leadMovedToTrash", { detail: { leadId } })
              );
            }
          }
        }

        console.log(`Lead ${leadId} ${fieldName} changed to: ${newValue}`);
      } catch (err) {
        // rollback
        setAllLeads(prevLeads);
        console.error(`Failed to update ${fieldName}:`, err);
        setToast({
          show: true,
          message: err.message || `Failed to update ${fieldName}`,
          type: "error",
        });
      }
    },
    [authToken, courses]
  );

  const handleStatusChange = useCallback(
    (leadId, newStatus) => updateLeadField(leadId, "status", newStatus),
    [updateLeadField]
  );
  const handleSubStatusChange = useCallback(
    (leadId, newSubStatus) =>
      updateLeadField(leadId, "substatus", newSubStatus),
    [updateLeadField]
  );
  const handleRemarkChange = useCallback(
    (leadId, newRemark) => updateLeadField(leadId, "remarks", newRemark),
    [updateLeadField]
  );
  const handleLastCallChange = useCallback(
    (leadId, newDate) => updateLeadField(leadId, "last_call", newDate),
    [updateLeadField]
  );
  const handleNextCallChange = useCallback(
    (leadId, newDate) => updateLeadField(leadId, "next_call", newDate),
    [updateLeadField]
  );
  const handleAgeChange = useCallback(
    (leadId, newAge) => updateLeadField(leadId, "age", newAge),
    [updateLeadField]
  );
  const handleGradeChange = useCallback(
    (leadId, newGrade) => updateLeadField(leadId, "grade", newGrade),
    [updateLeadField]
  );

  const handleCourseDurationChange = useCallback(
    (leadId, newDuration) =>
      updateLeadField(leadId, "course_duration", newDuration),
    [updateLeadField]
  );

  const handleAssignedToChange = useCallback(
    (leadId, newAssignedTo) =>
      updateLeadField(leadId, "assigned_to_username", newAssignedTo),
    [updateLeadField]
  );

  const handleExport = useCallback(async () => {
    try {
      // Preferred: ask backend to build and return the CSV file
      if (authToken) {
        try {
          const backendExportUrl = `${BASE_URL}/leads/export-csv/export`;
          const resp = await fetch(backendExportUrl, {
            headers: { Authorization: `Token ${authToken}` },
          });
          if (resp.ok) {
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "leads-backend-export.csv";
            a.click();
            window.URL.revokeObjectURL(url);
            return; // done
          }
          console.warn(
            "Backend export failed, falling back to client-side export",
            resp.status
          );
        } catch (e) {
          console.warn("Backend export attempt failed:", e);
          // fall through to client-side export
        }
      }

      // Fallback: build CSV client-side so we can include all fields
      const rows = allLeads || [];
      if (!rows.length) {
        setError("No leads to export");
        return;
      }

      const headers = [
        "id",
        "student_name",
        "parents_name",
        "email",
        "phone_number",
        "whatsapp_number",
        "age",
        "grade",
        "source",
        "course_name",
        "course",
        "course_duration",
        "class_type",
        "shift",
        "status",
        "substatus",
        "assigned_to",
        "assigned_to_username",
        "lead_type",
        "school_college_name",
        "previous_coding_experience",
        "value",
        "adset_name",
        "remarks",
        "payment_type",
        "device",
        "workshop_batch",
        "address_line_1",
        "address_line_2",
        "city",
        "county",
        "post_code",
        "add_date",
        "created_by",
        "last_call",
        "next_call",
      ];

      const escape = (v) => {
        if (v === null || v === undefined) return "";
        return String(v).includes(",") || String(v).includes("\n")
          ? `"${String(v).replace(/"/g, '""')}"`
          : String(v);
      };

      const csv = [headers.join(",")]
        .concat(
          rows.map((r) =>
            headers
              .map((h) => {
                switch (h) {
                  case "substatus":
                    return r.substatus || r.sub_status || "";
                  case "assigned_to":
                    return r.assigned_to || "";
                  case "assigned_to_username":
                    return r.assigned_to_username || r.assigned_to || "";
                  case "course_duration":
                    return r.course_duration || r.courseDuration || "";
                  case "previous_coding_experience":
                    return (
                      r.previous_coding_experience || r.previousCodingExp || ""
                    );
                  case "post_code":
                    return r.post_code || r.postCode || "";
                  case "created_by":
                    return r.created_by || r.assigned_to || r.createdBy || "";
                  default:
                    return r[h] ?? "";
                }
              })
              .map(escape)
              .join(",")
          )
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to export CSV");
    }
  }, [authToken, allLeads]);
  const [leads, setLeads] = useState([]);

  const handleFieldChange = (id, field, value) => {
    setLeads((prev) =>
      prev.map((lead) => (lead._id === id ? { ...lead, [field]: value } : lead))
    );
  };

  const handleDelete = useCallback(
    async (leadId) => {
      if (window.confirm("Are you sure you want to move this lead to trash?")) {
        try {
          // Mark the lead as 'Lost' using the update endpoint (backend accepts "Lost").
          await leadService.updateLead(leadId, { status: "Lost" }, authToken);
          setAllLeads((prevLeads) =>
            prevLeads.filter((lead) => lead._id !== leadId)
          );
        } catch (err) {
          setError(err.message || "Failed to move lead to trash");
        }
      }
    },
    [authToken]
  );

  const handleBulkDelete = useCallback(
    async (leadIds) => {
      try {
        // Mark each selected lead as 'Lost' via the update endpoint.
        await Promise.all(
          leadIds.map((id) =>
            leadService.updateLead(id, { status: "Lost" }, authToken)
          )
        );
        // Remove the leads from the local state
        setAllLeads((prevLeads) =>
          prevLeads.filter((lead) => !leadIds.includes(lead._id))
        );
      } catch (err) {
        setError(err.message || "Failed to move selected leads to trash");
      }
    },
    [authToken]
  );

  // Admin status check
  const role = user?.role?.toString().toLowerCase();
  const isAdmin =
    user &&
    (role === "admin" ||
      role === "super admin" ||
      role === "superadmin" ||
      role === "super-admin");

  // Admins/super-admins should see all leads by default
  // For non-admins, hide Converted/Lost/Junk except when the lead is assigned to the current user
  let currentLeads = [...allLeads];
  if (!isAdmin) {
    const username =
      (user && user.username) || localStorage.getItem("username") || "";
    const normalizedUsername = String(username).trim().toLowerCase();
    currentLeads = allLeads.filter((lead) => {
      // consider the lead assigned to current user if normalized matches
      const aNorm = (lead.assigned_to_normalized || "")
        .toString()
        .trim()
        .toLowerCase();
      const auNorm = (lead.assigned_to_username_normalized || "")
        .toString()
        .trim()
        .toLowerCase();
      const isAssigned =
        normalizedUsername &&
        (aNorm === normalizedUsername || auNorm === normalizedUsername);
      // keep assigned leads regardless of status; otherwise filter out Converted/Lost
      return (
        isAssigned || (lead.status !== "Converted" && lead.status !== "Lost")
      );
    });
  }

  // Robust filter chaining for all advanced filters
  if (filterStatus && filterStatus !== "All") {
    currentLeads = currentLeads.filter(
      (lead) => (lead.status || "") === filterStatus
    );
  }
  if (searchTerm && searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    currentLeads = currentLeads.filter(
      (lead) =>
        (lead.student_name && lead.student_name.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.phone_number && lead.phone_number.toLowerCase().includes(q))
    );
  }
  if (filterAge && filterAge.trim()) {
    currentLeads = currentLeads.filter(
      (lead) => lead.age && lead.age.toString().includes(filterAge.trim())
    );
  }
  if (filterGrade && filterGrade.trim()) {
    currentLeads = currentLeads.filter(
      (lead) => lead.grade && lead.grade.toString().includes(filterGrade.trim())
    );
  }
  if (filterLastCall && filterLastCall.trim()) {
    currentLeads = currentLeads.filter((lead) => {
      // Accept both YYYY-MM-DD and legacy formats
      const val = lead.last_call || lead.recentCall || "";
      return val === filterLastCall.trim();
    });
  }
  if (filterClassType && filterClassType !== "Class") {
    currentLeads = currentLeads.filter(
      (lead) => (lead.class_type || "") === filterClassType
    );
  }
  if (filterShift && filterShift !== "Shift") {
    currentLeads = currentLeads.filter(
      (lead) => (lead.shift || "") === filterShift
    );
  }
  if (filterDevice && filterDevice !== "Device") {
    currentLeads = currentLeads.filter(
      (lead) => (lead.device || "") === filterDevice
    );
  }
  if (filterSubStatus && filterSubStatus !== "SubStatus") {
    currentLeads = currentLeads.filter(
      (lead) => (lead.sub_status || lead.substatus || "") === filterSubStatus
    );
  }
  if (filterPrevCodingExp && filterPrevCodingExp !== "CodingExp") {
    currentLeads = currentLeads.filter(
      (lead) => (lead.previous_coding_experience || "") === filterPrevCodingExp
    );
  }

  // Role-based visibility: non-admin users see only leads assigned to them
  if (!isAdmin) {
    const username =
      (user && user.username) || localStorage.getItem("username") || "";
    const normalizedUsername = String(username).trim().toLowerCase();
    if (normalizedUsername) {
      currentLeads = currentLeads.filter((lead) => {
        // Use normalized assigned fields when available (set during fetch)
        const aNorm = (lead.assigned_to_normalized || "").trim().toLowerCase();
        const auNorm = (lead.assigned_to_username_normalized || "")
          .trim()
          .toLowerCase();
        // Fallback to raw fields
        const aRaw = String(lead.assigned_to || "").trim();
        const auRaw = String(lead.assigned_to_username || "").trim();

        return (
          (aNorm && aNorm === normalizedUsername) ||
          (auNorm && auNorm === normalizedUsername) ||
          (aRaw && aRaw === username) ||
          (auRaw && auRaw === username)
        );
      });
    }
  }

  // DEBUG: print why leads may be filtered out
  try {
    const debugUser =
      (user && user.username) || localStorage.getItem("username") || "";
    const debugNorm = String(debugUser).trim().toLowerCase();
    console.log(
      "[Leads debug] current user:",
      debugUser,
      "normalized:",
      debugNorm
    );
    console.log(
      "[Leads debug] allLeads count:",
      allLeads.length,
      "-> displayed count:",
      currentLeads.length,
      "filterStatus:",
      filterStatus
    );
    currentLeads.forEach((l) => {
      const aNorm = (l.assigned_to_normalized || "")
        .toString()
        .trim()
        .toLowerCase();
      const auNorm = (l.assigned_to_username_normalized || "")
        .toString()
        .trim()
        .toLowerCase();
      const aRaw = String(l.assigned_to || "").trim();
      const auRaw = String(l.assigned_to_username || "").trim();
      const isAssigned =
        debugNorm &&
        (aNorm === debugNorm ||
          auNorm === debugNorm ||
          aRaw === debugUser ||
          auRaw === debugUser);
      console.log(
        "[Leads debug] lead",
        l._id,
        "status",
        l.status,
        "assigned_to:",
        l.assigned_to,
        "assigned_to_username:",
        l.assigned_to_username,
        "aNorm:",
        aNorm,
        "auNorm:",
        auNorm,
        "isAssigned:",
        isAssigned
      );
    });
  } catch (e) {
    console.error("Leads debug error", e);
  }

  if (loading) {
    return <DelayedLoader message="Loading leads..." minMs={2000} />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>Error: {error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Debugging: inspect user and leads counts before render
  console.log("Auth user:", user);
  console.log("All leads count:", allLeads.length);
  console.log("Displayed leads count:", displayedLeads.length);
  console.log("Current filterStatus:", filterStatus);
  if (displayedLeads && displayedLeads.length > 0)
    console.log("Sample displayed lead:", displayedLeads[0]);

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast({ show: false, message: "", type: "success" })
          }
        />
      )}
      <h1 className="text-3xl font-bold mb-6">Leads Management</h1>

      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
            Add New Lead
          </button>

          {/* Import CSV (posts to /leads/from/ via service) */}
          <ImportCsvButton
            authToken={authToken}
            courses={courses}
            onImported={handleRefresh}
          />

          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowDownTrayIcon className="h-5 w-5 inline-block mr-2" />
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowPathIcon className="h-5 w-5 inline-block mr-2" />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Email, Phone, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FunnelIcon className="h-5 w-5 inline-block mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center justify-end mb-6 gap-3 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
          <h3 className="text-lg font-semibold mr-4">Advanced Filters:</h3>
          <div className="relative w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter by Age..."
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter by Grade..."
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <input
              type="date"
              value={filterLastCall}
              onChange={(e) => setFilterLastCall(e.target.value)}
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={filterClassType}
              onChange={(e) => setFilterClassType(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {classTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {shiftOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {deviceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={filterSubStatus}
              onChange={(e) => setFilterSubStatus(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {subStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={filterPrevCodingExp}
              onChange={(e) => setFilterPrevCodingExp(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {previousCodingExpOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          // Debugging fallback: if filters hide all leads, pass allLeads so we can confirm rendering
          <LeadTableDisplay
            leads={leads}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleBulkDelete={handleBulkDelete}
            onStatusChange={handleStatusChange}
            onSubStatusChange={handleSubStatusChange}
            onRemarkChange={handleRemarkChange}
            onRecentCallChange={handleLastCallChange}
            onNextCallChange={handleNextCallChange}
            onAgeChange={handleAgeChange}
            onGradeChange={handleGradeChange}
            onCourseDurationChange={handleCourseDurationChange}
            onAssignedToChange={handleAssignedToChange}
            authToken={authToken}
            changeLogService={changeLogService}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            leadsPerPage={pageSize}
            users={users}
            usersLoading={usersLoading}
            currentUserRole={(user?.role || "").toString().toLowerCase()}
            handleFieldChange={handleFieldChange}
          />
        )}
      </div>

      {isEditModalOpen && editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          courses={courses}
        />
      )}
      {isAddModalOpen && (
        <AddLeadModal
          onClose={handleCloseAddModal}
          onSave={handleAddNewLead}
          courses={courses}
          authToken={authToken}
        />
      )}
    </div>
  );
};

export default Leads;
