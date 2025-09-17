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

  // core state
  const [allLeads, setAllLeads] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [filterAge, setFilterAge] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterLastCall, setFilterLastCall] = useState("");
  const [filterClassType, setFilterClassType] = useState("Class");
  const [filterShift, setFilterShift] = useState("Shift");
  const [filterDevice, setFilterDevice] = useState("Device");
  const [filterSubStatus, setFilterSubStatus] = useState("SubStatus");
  const [filterPrevCodingExp, setFilterPrevCodingExp] = useState("CodingExp");
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = ["All", "Active", "Converted", "Lost"];

  // Ensure any leads array we store locally contains a stable `_id` field that
  // the UI expects (some backends return `id`, others `_id`). This helper
  // guarantees consistent identity so per-row updates (remarks/status/etc.)
  // can find and update the right lead.
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
      // Get leads and courses data
      const [leadsData, coursesData] = await Promise.all([
        leadService.getLeads(authToken),
        courseService.getCourses(authToken),
      ]);

      // Process leads to ensure course_name is set
      const processedLeads = leadsData.map((lead) => ({
        ...lead,
        // backend may use `substatus` (no underscore) or `sub_status` — normalize to `sub_status` for UI
        sub_status: lead.sub_status || lead.substatus || "New",
        // normalize assigned username and assigned_to
        assigned_to:
          lead.assigned_to ||
          lead.assigned_to_username ||
          lead.assigned_to ||
          "",
        assigned_to_username:
          lead.assigned_to_username || lead.assigned_to || "",
        // normalized variants for reliable comparisons
        assigned_to_normalized: (
          lead.assigned_to ||
          lead.assigned_to_username ||
          ""
        )
          .toString()
          .trim()
          .toLowerCase(),
        assigned_to_username_normalized: (
          lead.assigned_to_username ||
          lead.assigned_to ||
          ""
        )
          .toString()
          .trim()
          .toLowerCase(),
        course_name: lead.course_name || "N/A", // Ensure course_name is always set
      }));

      // Sort leads newest-first so newly created/converted items remain at top
      const processedLeadsSorted = (processedLeads || [])
        .slice()
        .sort((a, b) => {
          const ta = a.created_at || a.updated_at || a.add_date || null;
          const tb = b.created_at || b.updated_at || b.add_date || null;
          if (ta && tb) return new Date(tb) - new Date(ta);
          if (a.id !== undefined && b.id !== undefined)
            return Number(b.id) - Number(a.id);
          return 0;
        });

      setAllLeads(processedLeadsSorted);
      // Normalize coursesData to an array (support paginated { results: [] })
      if (
        coursesData &&
        !Array.isArray(coursesData) &&
        Array.isArray(coursesData.results)
      ) {
        setCourses(coursesData.results);
      } else {
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      }
    } catch (err) {
      setError(err.message || "Failed to refresh leads");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // Load leads & courses when component mounts: fetch first page quickly then load rest in background
  useEffect(() => {
    if (!authToken) {
      setError("You are not logged in. Please log in to view leads.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const baseUrl = `${BASE_URL}/leads/`;

    const fetchFastThenFull = async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch courses first and normalize to array
        let coursesData = await courseService.getCourses(authToken);
        if (
          coursesData &&
          !Array.isArray(coursesData) &&
          Array.isArray(coursesData.results)
        ) {
          coursesData = coursesData.results;
        }
        if (!cancelled)
          setCourses(Array.isArray(coursesData) ? coursesData : []);

        const fastUrl = `${baseUrl}?page=1&page_size=20`;
        const resp = await fetch(fastUrl, {
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });

        if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json.results)) {
            if (!cancelled) setAllLeads(ensureLeadIds(json.results));
            // background fetch remaining pages
            (async () => {
              try {
                if (json.next) {
                  let acc = [...json.results];
                  let next = json.next;
                  const MAX_ACCUMULATE = 2000; // protect the client from huge loads
                  while (next) {
                    const r = await fetch(next, {
                      headers: { Authorization: `Token ${authToken}` },
                      credentials: "include",
                    });
                    if (!r.ok) break;
                    const j = await r.json();
                    acc = acc.concat(j.results || []);
                    // stop accumulating very large datasets to avoid freezing the UI
                    if (acc.length >= MAX_ACCUMULATE) {
                      console.warn(
                        "Leads background fetch: reached accumulate cap, stopping further background fetch to avoid UI freeze"
                      );
                      break;
                    }
                    next = j.next;
                  }
                  if (!cancelled)
                    setAllLeads(ensureLeadIds(acc.slice(0, MAX_ACCUMULATE)));
                } else {
                  const full = await fetch(baseUrl, {
                    headers: { Authorization: `Token ${authToken}` },
                    credentials: "include",
                  });
                  if (full.ok) {
                    const all = await full.json();
                    if (!cancelled)
                      setAllLeads(
                        ensureLeadIds(
                          Array.isArray(all) ? all : all.results || []
                        )
                      );
                  }
                }
              } catch (e) {
                console.warn("Background leads fetch failed", e);
              }
            })();
            return;
          }

          if (Array.isArray(json)) {
            if (!cancelled) setAllLeads(ensureLeadIds(json.slice(0, 20)));
            (async () => {
              try {
                const full = await fetch(baseUrl, {
                  headers: { Authorization: `Token ${authToken}` },
                  credentials: "include",
                });
                if (full.ok) {
                  const all = await full.json();
                  if (!cancelled)
                    setAllLeads(
                      ensureLeadIds(
                        Array.isArray(all) ? all : all.results || []
                      )
                    );
                }
              } catch (e) {
                console.warn("Background full leads fetch failed", e);
              }
            })();
            return;
          }
        }

        // fallback full fetch
        const fallback = await fetch(baseUrl, {
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });
        if (fallback.ok) {
          const data = await fallback.json();
          if (!cancelled)
            setAllLeads(
              ensureLeadIds(Array.isArray(data) ? data : data.results || [])
            );
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err.message || "Failed to load leads");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFastThenFull();

    // listen for global import events to refresh leads automatically
    const importDebounceRef = { current: null };
    const onImported = (e) => {
      console.info("Leads.jsx detected crm:imported event, scheduling refresh");
      // debounce to prevent overlapping fetches when multiple events fire
      if (importDebounceRef.current) clearTimeout(importDebounceRef.current);
      importDebounceRef.current = setTimeout(() => {
        handleRefresh();
        importDebounceRef.current = null;
      }, 700);
    };
    window.addEventListener("crm:imported", onImported);

    // Listen for lead updates broadcast by the API layer so edits reflect instantly
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

    return () => {
      cancelled = true;
      window.removeEventListener("crm:imported", onImported);
      window.removeEventListener("crm:leadUpdated", onLeadUpdated);
      if (importDebounceRef.current) clearTimeout(importDebounceRef.current);
    };
  }, [authToken]);

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
          await fetch(`${BASE_URL}/enrollments/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(newLeadData),
          });
        } else if (newLeadData.status === "Lost") {
          // Backend accepts updating a lead to 'Lost' via updateLead.
          try {
            await leadService.updateLead(
              newLeadData._id || newLeadData.id,
              { status: "Lost" },
              authToken
            );
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
      try {
        let payload = { ...updatedLead };
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

        // Use backend id when available for the PATCH endpoint
        const serverId = updatedLead.id || updatedLead._id;
        await leadService.updateLead(serverId, payload, authToken);

        // Update local copy
        setAllLeads((prev) =>
          prev.map((l) =>
            l._id === updatedLead._id ? { ...l, ...updatedLead } : l
          )
        );

        handleCloseEditModal();
      } catch (err) {
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
      try {
        // Special behavior for status transitions
        if (fieldName === "status") {
          // Determine server id (backend primary key) when available.
          // UI uses `_id` as the stable key; backend may use `id`.
          const leadObj = allLeads.find((l) => l._id === leadId) || {};
          const serverId = leadObj.id || leadId;

          // Update the lead status first
          await leadService.updateLead(
            serverId,
            { [fieldName]: newValue },
            authToken
          );

          // Remove from local list for statuses that should no longer appear
          if (newValue === "Lost" || newValue === "Converted") {
            setAllLeads((prevLeads) =>
              prevLeads.filter((lead) => lead._id !== leadId)
            );
          }

          // If the lead was converted, create an enrollment record
          if (newValue === "Converted") {
            try {
              // Try to find the lead object either in local state or by fetching
              const leadObj = allLeads.find((l) => l._id === leadId) || {};
              // Build enrollment payload expected by backend
              const resolvedCourseId =
                leadObj.course &&
                (typeof leadObj.course === "number" ||
                  /^\d+$/.test(String(leadObj.course)))
                  ? leadObj.course
                  : leadObj.course_name
                  ? (
                      courses.find(
                        (c) =>
                          (c.course_name || c.name || "").toString().trim() ===
                          String(leadObj.course_name).trim()
                      ) || {}
                    ).id
                  : null;

              const enrollmentPayload = {
                lead: leadObj.id || leadId,
                course: resolvedCourseId || null,
                total_payment: leadObj.value || null,
                first_installment: null,
                second_installment: null,
                third_installment: null,
                batchname: "",
                last_pay_date: null,
                payment_completed: false,
                starting_date: null,
                assigned_teacher: "",
                // allow backend to infer created_by from auth
              };

              // Create the enrollment and dispatch the created object so other
              // pages (EnrolledStudents) can update UI without refresh.
              try {
                const created = await enrollmentService.createEnrollment(
                  enrollmentPayload,
                  authToken
                );
                console.log("Enrollment created for lead", leadId, created);
                const ev = new CustomEvent("crm:enrollmentCreated", {
                  detail: { enrollment: created },
                });
                window.dispatchEvent(ev);
                // Also broadcast that this lead was converted so other pages
                // (e.g., Leads, Trash) can position it appropriately.
                window.dispatchEvent(
                  new CustomEvent("crm:leadConverted", {
                    detail: { leadId: leadId, enrollment: created },
                  })
                );
              } catch (e) {
                console.error("Failed to create enrollment:", e);
              }
            } catch (enrollErr) {
              console.error(
                "Failed to create enrollment for converted lead:",
                enrollErr
              );
            }
          }

          // If marked lost, broadcast event so Trash page can update immediately
          if (newValue === "Lost") {
            window.dispatchEvent(
              new CustomEvent("crm:leadMovedToTrash", { detail: { leadId } })
            );
          }

          return;
        }

        // Map course name -> id on change
        const updatesToSend = { [fieldName]: newValue };
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

        // Use backend id when available so PATCH targets the right resource
        const leadObj = allLeads.find((l) => l._id === leadId) || {};
        const serverId = leadObj.id || leadId;

        await leadService.updateLead(serverId, updatesToSend, authToken);

        // Local update
        setAllLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, [fieldName]: newValue } : lead
          )
        );
        console.log(`Lead ${leadId} ${fieldName} changed to: ${newValue}`);
      } catch (err) {
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
      updateLeadField(leadId, "assigned_to", newAssignedTo),
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

  // Filtering
  const displayedLeads = useMemo(() => {
    // Determine admin status
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

    if (filterStatus && filterStatus !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      currentLeads = currentLeads.filter(
        (lead) =>
          (lead.student_name && lead.student_name.toLowerCase().includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          (lead.phone_number && lead.phone_number.toLowerCase().includes(q))
      );
    }
    if (filterAge) {
      currentLeads = currentLeads.filter(
        (lead) => lead.age && lead.age.toString().includes(filterAge)
      );
    }
    if (filterGrade) {
      currentLeads = currentLeads.filter(
        (lead) => lead.grade && lead.grade.toString().includes(filterGrade)
      );
    }
    if (filterLastCall) {
      currentLeads = currentLeads.filter(
        (lead) => lead.last_call && lead.last_call === filterLastCall
      );
    }
    if (filterClassType && filterClassType !== "Class") {
      currentLeads = currentLeads.filter(
        (lead) => lead.class_type === filterClassType
      );
    }
    if (filterShift && filterShift !== "Shift") {
      currentLeads = currentLeads.filter((lead) => lead.shift === filterShift);
    }
    if (filterDevice && filterDevice !== "Device") {
      currentLeads = currentLeads.filter(
        (lead) => lead.device === filterDevice
      );
    }
    if (filterSubStatus && filterSubStatus !== "SubStatus") {
      currentLeads = currentLeads.filter(
        (lead) => lead.sub_status === filterSubStatus
      );
    }
    if (filterPrevCodingExp && filterPrevCodingExp !== "CodingExp") {
      currentLeads = currentLeads.filter(
        (lead) => lead.previous_coding_experience === filterPrevCodingExp
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
          const aNorm = (lead.assigned_to_normalized || "")
            .trim()
            .toLowerCase();
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

    return currentLeads;
  }, [
    allLeads,
    searchTerm,
    filterStatus,
    filterAge,
    filterGrade,
    filterLastCall,
    filterClassType,
    filterShift,
    filterDevice,
    filterPrevCodingExp,
    user,
  ]);

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
            leads={
              displayedLeads && displayedLeads.length > 0
                ? displayedLeads
                : allLeads
            }
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
