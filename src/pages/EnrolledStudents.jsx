// src/pages/EnrolledStudents.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Loader from "../components/common/Loader";
import DelayedLoader from "../components/common/DelayedLoader";
import { useAuth } from "../context/AuthContext.jsx";
import EnrolledStudentsTable from "../components/EnrolledStudentsTable";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import EnrolledStudentEditModal from "../components/EnrolledStudentEditModal";
import { courseService } from "../services/courseService";
import { BASE_URL } from "../config";
import Toast from "../components/common/Toast";

// A small in-memory map to deduplicate identical outgoing requests
// (helps avoid duplicate fetches triggered by StrictMode double-invoke
// or concurrent callers). Each entry holds the Promise for the request
// and is removed when finished.
const _ongoingRequests = new Map();

async function safeFetchWithRetries(
  url,
  opts = {},
  retries = 3,
  backoff = 300,
  timeoutMs = 8000
) {
  const controller = new AbortController();
  const mergedOpts = { ...opts, signal: controller.signal };

  for (let attempt = 0; attempt <= retries; attempt++) {
    let timeoutHandle;
    try {
      const p = fetch(url, mergedOpts);
      const race = new Promise((_, rej) => {
        timeoutHandle = setTimeout(() => {
          try {
            controller.abort();
          } catch (e) {}
          rej(new Error("timeout"));
        }, timeoutMs);
      });
      const resp = await Promise.race([p, race]);
      clearTimeout(timeoutHandle);
      return resp;
    } catch (e) {
      clearTimeout(timeoutHandle);
      const isLast = attempt === retries;
      if (isLast) {
        console.warn(
          `safeFetch: network error when fetching ${url} (attempt ${
            attempt + 1
          }/${retries + 1})`,
          e && e.message ? e.message : e
        );
        console.error(`safeFetch: exhausted retries for ${url}`);
      } else if (typeof console.debug === "function") {
        console.debug(
          `safeFetch: retrying ${url} (attempt ${attempt + 1}/$${retries + 1})`
        );
      }
      if (isLast) return null;
      await new Promise((res) =>
        setTimeout(res, backoff * Math.pow(2, attempt))
      );
    }
  }
  return null;
}

const EnrolledStudents = () => {
  const { authToken } = useAuth();
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLastPaymentDate, setSearchLastPaymentDate] = useState("");
  const [filterPaymentNotCompleted, setFilterPaymentNotCompleted] =
    useState(false);
  const [filterScheduledTaken, setFilterScheduledTaken] = useState(""); // "", "Yes", "No"
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Refs for debounced server filter fetching
  const searchQueryRef = useRef(searchQuery);
  const searchLastPaymentDateRef = useRef(searchLastPaymentDate);
  const filterPaymentNotCompletedRef = useRef(filterPaymentNotCompleted);
  const filterScheduledTakenRef = useRef(filterScheduledTaken);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);
  useEffect(() => {
    searchLastPaymentDateRef.current = searchLastPaymentDate;
  }, [searchLastPaymentDate]);
  useEffect(() => {
    filterPaymentNotCompletedRef.current = filterPaymentNotCompleted;
  }, [filterPaymentNotCompleted]);
  useEffect(() => {
    filterScheduledTakenRef.current = filterScheduledTaken;
  }, [filterScheduledTaken]);

  const TEACHERS_LIST_URL = `${BASE_URL}/teachers/`;
  // Explicit absolute API base required for enrollment updates (PUT/PATCH)
  const ENROLLMENTS_API_BASE =
    "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/enrollments/";

  const fetchTeachers = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch(TEACHERS_LIST_URL, {
        headers: { Authorization: `Token ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      const data = await res.json();
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data && Array.isArray(data.results)) list = data.results;
      else if (data && Array.isArray(data.data)) list = data.data;
      else if (data && Array.isArray(data.teachers)) list = data.teachers;
      const normalized = list
        .map((t) => ({
          id: t.id || t.pk || t._id || t.teacher_id || t.uuid,
          name: t.name || t.teacher_name || t.full_name || t.title || "",
        }))
        .filter((t) => t.id != null);
      setTeachers(normalized);
    } catch (e) {
      console.warn("Failed loading teachers", e);
    }
  }, [authToken]);

  // Local, client-side filtered view of the current page of students.
  // This lets typing in the search box filter the visible table immediately
  // without waiting for the debounced server fetch. Server-driven filters
  // still occur (debounced) to update server-side results across pages.
  const filteredStudents = useMemo(() => {
    if (!allStudents || allStudents.length === 0) return [];
    const q = (searchQuery || "").trim().toLowerCase();
    const dateFilter = (searchLastPaymentDate || "").trim();
    return allStudents.filter((s) => {
      try {
        // Payment not completed filter (client-side)
        if (filterPaymentNotCompleted) {
          const pc = s.payment_completed;
          // treat null/undefined/false as not completed
          if (pc === true || String(pc) === "true") return false;
        }

        // Last payment date filter (exact match on yyyy-mm-dd)
        if (dateFilter) {
          const lp = s.last_pay_date || (s.lead && s.lead.last_pay_date) || "";
          const lpDate = lp ? lp.split("T")[0] : "";
          if (lpDate !== dateFilter) return false;
        }

        // scheduled_taken filter (client-side). Accepts "" (all), "Yes", "No"
        if (filterScheduledTaken) {
          const schedVal =
            s.scheduled_taken ||
            s.demo_scheduled ||
            (s.lead && (s.lead.scheduled_taken || s.lead.demo_scheduled)) ||
            "";
          const normalized = String(schedVal).toLowerCase();
          if (
            filterScheduledTaken === "Yes" &&
            normalized !== "yes" &&
            normalized !== "true"
          )
            return false;
          if (
            filterScheduledTaken === "No" &&
            normalized !== "no" &&
            normalized !== "false"
          )
            return false;
        }

        if (!q) return true;
        const fields = [
          s.student_name,
          s.email,
          s.phone_number,
          s.parents_name,
          s.lead && s.lead.student_name,
          s.lead && s.lead.email,
          s.lead && s.lead.phone_number,
        ];
        return fields.some((f) =>
          (f || "").toString().toLowerCase().includes(q)
        );
      } catch (e) {
        return true;
      }
    });
  }, [
    allStudents,
    searchQuery,
    searchLastPaymentDate,
    filterPaymentNotCompleted,
    filterScheduledTaken,
  ]);

  // Server-driven pagination: fetch enrollments for a page
  const fetchEnrolledStudents = useCallback(
    async (page = 1) => {
      if (!authToken) return;
      // For background/debounced fetches, we toggle `loading` so export
      // and buttons can disable, but we keep the table visible unless
      // this is the initial load.
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("page_size", String(ITEMS_PER_PAGE));
        // read latest filter values from refs to keep this function stable
        const sq = searchQueryRef.current;
        const slp = searchLastPaymentDateRef.current;
        const fNotCompleted = filterPaymentNotCompletedRef.current;
        const fDemo = filterScheduledTakenRef.current;
        if (sq && sq.trim()) params.append("search", sq.trim());
        if (slp && slp.trim()) params.append("last_pay_date", slp.trim());
        if (fNotCompleted) params.append("payment_completed", "false");
        if (fDemo && (fDemo === "Yes" || fDemo === "No")) {
          params.append("scheduled_taken", fDemo === "Yes" ? "true" : "false");
        }

        const url = `${BASE_URL}/enrollments/?${params.toString()}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });
        if (!resp.ok)
          throw new Error(`Failed to fetch enrollments: ${resp.status}`);
        const json = await resp.json();
        let list = [];
        let count = null;
        if (Array.isArray(json)) {
          list = json;
          count = json.length;
        } else if (Array.isArray(json.results)) {
          list = json.results;
          count = json.count ?? null;
        } else if (Array.isArray(json.data)) {
          list = json.data;
          count = json.count ?? null;
        }

        // Deduplicate by primary id (enrollment id). Keep the FIRST occurrence from latest fetch.
        const seen = new Set();
        const deduped = (list || []).filter((item) => {
          const id = item && (item.id || item._id);
          if (id == null) return true; // keep items without id defensively
          const key = String(id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setAllStudents(deduped);
        setCurrentPage(page);
        if (count != null) {
          setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)));
        } else {
          setTotalPages(
            Math.max(1, Math.ceil((list || []).length / ITEMS_PER_PAGE))
          );
        }
      } catch (err) {
        console.error("Failed to fetch enrollments page:", err);
        setError(err.message || "Failed to load enrollments");
      } finally {
        setLoading(false);
        // After the first successful or failed attempt, clear initialLoad
        if (initialLoad) setInitialLoad(false);
      }
    },
    // NOTE: we intentionally omit filter state variables from the dependency
    // list so this function remains stable while the UI updates filter state
    // on each keystroke. The function reads the latest filter values from
    // refs (searchQueryRef, searchLastPaymentDateRef, filterPaymentNotCompletedRef)
    // which are kept in sync by effects above.
    [authToken]
  );

  useEffect(() => {
    if (!authToken) return;
    fetchEnrolledStudents(currentPage);

    const importDebounce = { timeoutId: null };
    const onImported = (e) => {
      if (importDebounce.timeoutId) clearTimeout(importDebounce.timeoutId);
      importDebounce.timeoutId = setTimeout(() => {
        fetchEnrolledStudents(currentPage);
        importDebounce.timeoutId = null;
      }, 700);
    };
    window.addEventListener("crm:imported", onImported);

    return () => {
      window.removeEventListener("crm:imported", onImported);
      if (importDebounce.timeoutId) clearTimeout(importDebounce.timeoutId);
    };
  }, [authToken, fetchEnrolledStudents, currentPage]);

  // Respond to lead updates: if backend returns enrollment info or updates a
  // student's fields, merge them into enrolled students list.
  useEffect(() => {
    const onLeadUpdated = (e) => {
      try {
        const updated = e?.detail?.lead;
        if (!updated) return;

        // If the updated lead includes an enrollment id or resembles an enrollment
        // object, try to merge by id or insert if new.
        const enrollmentCandidate = updated.enrollment || null;

        if (enrollmentCandidate && enrollmentCandidate.id) {
          setAllStudents((prev) => {
            const seen = new Set();
            const updatedList = [];
            let mergedHandled = false;
            // Prepend merged/updated enrollment first
            updatedList.push({ ...enrollmentCandidate });
            seen.add(String(enrollmentCandidate.id));
            for (const s of prev) {
              const sid = s && s.id != null ? String(s.id) : null;
              if (!sid) {
                updatedList.push(s);
                continue;
              }
              if (sid === String(enrollmentCandidate.id)) {
                if (!mergedHandled) {
                  // already pushed new version at top; mark handled
                  mergedHandled = true;
                }
                continue; // skip old duplicate
              }
              if (seen.has(sid)) continue; // skip any dup just in case
              seen.add(sid);
              updatedList.push(s);
            }
            return updatedList;
          });
          return;
        }

        // Otherwise attempt to match by email/phone if the lead became an enrolled
        // student and the backend returned student-like fields (best-effort).
        setAllStudents((prev) => {
          let changed = false;
          const next = [];
          const seen = new Set();
          for (const s of prev) {
            if (!s) continue;
            const sid = s.id != null ? String(s.id) : null;
            if (
              (updated.email && s.email === updated.email) ||
              (updated.phone_number && s.phone_number === updated.phone_number)
            ) {
              changed = true;
              const merged = { ...s, ...updated };
              // Move merged match to TOP if not already placed
              if (sid && !seen.has(sid)) {
                seen.add(sid);
                next.unshift(merged); // put at start
              } else {
                next.unshift(merged);
              }
            } else {
              if (sid) {
                if (seen.has(sid)) continue; // skip duplicates
                seen.add(sid);
              }
              next.push(s);
            }
          }
          return changed ? next : prev;
        });
      } catch (err) {
        console.warn("EnrolledStudents: failed to apply crm:leadUpdated", err);
      }
    };

    window.addEventListener("crm:leadUpdated", onLeadUpdated);
    return () => window.removeEventListener("crm:leadUpdated", onLeadUpdated);
  }, []);

  // Listen for enrollment created events so we can insert new enrollments
  // without requiring a page refresh.
  useEffect(() => {
    const onEnrollmentCreated = (e) => {
      try {
        const enrollment = e?.detail?.enrollment;
        if (!enrollment) return;
        setAllStudents((prev) => {
          const seen = new Set();
          const list = [enrollment];
          seen.add(String(enrollment.id));
          for (const s of prev) {
            const sid = s && s.id != null ? String(s.id) : null;
            if (sid && seen.has(sid)) continue; // skip duplicate
            if (sid) seen.add(sid);
            list.push(s);
          }
          return list;
        });
      } catch (err) {
        console.warn("Failed to handle crm:enrollmentCreated event", err);
      }
    };
    window.addEventListener("crm:enrollmentCreated", onEnrollmentCreated);
    return () =>
      window.removeEventListener("crm:enrollmentCreated", onEnrollmentCreated);
  }, []);

  // Fetch course list so we can display friendly course names in the table
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!authToken) return;
      try {
        const res = await courseService.getCourses(authToken);
        const list = Array.isArray(res) ? res : res?.results || [];
        if (!cancelled) setCourses(list);
      } catch (e) {
        console.warn("EnrolledStudents: failed to load courses", e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // Fetch teachers once auth available
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Refetch when filters change (debounced) and reset to page 1.
  // If we're not already on page 1, set page to 1 and let the page-change
  // effect trigger the fetch. If already on page 1, call fetch once.
  useEffect(() => {
    if (!authToken) return;
    const id = setTimeout(() => {
      if (currentPage !== 1) {
        // change page -> existing effect will call fetchEnrolledStudents(1)
        setCurrentPage(1);
      } else {
        // already on page 1 -> fetch once
        fetchEnrolledStudents(1);
      }
    }, 600); // slightly longer debounce to avoid firing on every small typing
    return () => clearTimeout(id);
  }, [
    searchQuery,
    searchLastPaymentDate,
    filterPaymentNotCompleted,
    filterScheduledTaken,
    authToken,
    fetchEnrolledStudents,
    currentPage,
  ]);

  // Export enrollments using backend export endpoint; passes current filters
  const handleExportEnrollments = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      // Build base params from current filters
      const baseParams = new URLSearchParams();
      if (searchQuery && searchQuery.trim())
        baseParams.append("search", searchQuery.trim());
      if (searchLastPaymentDate && searchLastPaymentDate.trim())
        baseParams.append("last_pay_date", searchLastPaymentDate.trim());
      if (filterPaymentNotCompleted)
        baseParams.append("payment_completed", "false");
      if (
        filterScheduledTaken &&
        (filterScheduledTaken === "Yes" || filterScheduledTaken === "No")
      )
        baseParams.append(
          "scheduled_taken",
          filterScheduledTaken === "Yes" ? "true" : "false"
        );

      // Fetch all pages from the enrollments endpoint
      let page = 1;
      const pageSize = 100; // fetch larger pages to reduce requests
      let all = [];
      while (true) {
        const params = new URLSearchParams(baseParams.toString());
        params.set("page", String(page));
        params.set("page_size", String(pageSize));
        const url = `${BASE_URL}/enrollments/?${params.toString()}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });
        if (!resp.ok)
          throw new Error(`Failed to fetch enrollments: ${resp.status}`);
        const json = await resp.json();
        let list = [];
        let count = null;
        if (Array.isArray(json)) {
          list = json;
        } else if (Array.isArray(json.results)) {
          list = json.results;
          count = json.count ?? null;
        } else if (Array.isArray(json.data)) {
          list = json.data;
          count = json.count ?? null;
        }
        all = all.concat(list || []);
        // break conditions
        if (count != null) {
          const pages = Math.max(1, Math.ceil(count / pageSize));
          if (page >= pages) break;
        } else {
          if (!list || list.length < pageSize) break;
        }
        page += 1;
      }

      if (!all || all.length === 0) throw new Error("No enrollments to export");

      // Build CSV
      const columns = [
        "id",
        "student_name",
        "parents_name",
        "email",
        "phone_number",
        "course",
        "batchname",
        "assigned_teacher",
        "scheduled_taken",
        "payment_type",
        "total_payment",
        "first_installment",
        "second_installment",
        "third_installment",
        "last_pay_date",
        "payment_completed",
        "starting_date",
        "created_at",
        "updated_at",
        "invoice",
        "remarks",
      ];

      const escapeCsv = (v) => {
        if (v === null || v === undefined) return "";
        let s = String(v);
        // If invoice is array/object, try to extract filenames/urls
        if (Array.isArray(v))
          s = v.map((i) => i.name || i.url || "").join(" | ");
        // escape
        if (s.includes(",") || s.includes("\n") || s.includes('"')) {
          s = '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      const rows = [columns.join(",")];
      all.forEach((r) => {
        const row = columns.map((c) => {
          // support nested lead fields if enrollment doesn't have them
          if (r[c] === undefined && r.lead && r.lead[c] !== undefined)
            return escapeCsv(r.lead[c]);
          return escapeCsv(r[c]);
        });
        rows.push(row.join(","));
      });

      const csv = rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "enrollments-export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to export enrollments (client-side):", err);
      setError(err.message || "Failed to export enrollments");
    } finally {
      setLoading(false);
    }
  }, [
    authToken,
    searchQuery,
    searchLastPaymentDate,
    filterPaymentNotCompleted,
    filterScheduledTaken,
  ]);

  // Instant field update (sends PATCH to backend immediately)
  const handleUpdateField = useCallback(
    async (studentId, field, value) => {
      // Capture snapshot at function level for error recovery
      const prevStudents = (allStudents || []).slice();

      const paymentFields = new Set([
        "total_payment",
        "first_installment",
        "second_installment",
        "third_installment",
      ]);

      // Allow scheduled_taken (legacy demo_scheduled) edits.

      // Map frontend field to backend field
      let backendField = field;
      if (field && field.startsWith("lead.")) {
        backendField = field.replace("lead.", "");
      }
      // Robust mapping for batchname and course_duration
      if (["batch_name", "batchName", "batchname"].includes(backendField)) {
        backendField = "batchname";
      }
      if (
        [
          "courseDuration",
          "course_duration",
          "courseDuration",
          "courseduration",
        ].includes(backendField)
      ) {
        backendField = "course_duration";
      }
      // Normalize possible assigned_teacher name updates
      if (
        ["assigned_teacher_name", "assignedTeacherName"].includes(backendField)
      ) {
        backendField = "assigned_teacher"; // we'll send the id; value expected should be id
      }

      // We'll apply an optimistic local update so the table reflects the
      // user's change immediately. If the PATCH fails we'll roll back.

      try {
        // Apply optimistic update locally so UI updates immediately.
        setAllStudents((prev) =>
          (prev || []).map((s) => {
            if (String(s.id) !== String(studentId)) return s;
            // clone
            const next = JSON.parse(JSON.stringify(s || {}));
            // Modal full-object update
            if (field === null && value && typeof value === "object") {
              // Merge allowed fields into enrollment and nested lead
              for (const [k, v] of Object.entries(value || {})) {
                if (k === "lead" && typeof v === "object") {
                  next.lead = { ...(next.lead || {}), ...v };
                } else if (k === "batch_name") {
                  next.batchname = v;
                } else {
                  // coerce numeric-like strings to numbers for payment fields
                  if (
                    [
                      "total_payment",
                      "first_installment",
                      "second_installment",
                      "third_installment",
                    ].includes(k) &&
                    (typeof v === "string" || typeof v === "number")
                  ) {
                    const n = Number(v);
                    next[k] = Number.isFinite(n) ? n : v;
                  } else {
                    next[k] = v;
                  }
                }
              }
            } else {
              // Single-field update
              if (field && field.startsWith("lead.")) {
                const leadKey = backendField;
                next.lead = { ...(next.lead || {}) };
                next.lead[leadKey] = value;
              } else {
                next[backendField] = value;
              }
            }
            return next;
          })
        );

        let payload = {};
        if (field === null && value && typeof value === "object") {
          // When modal sends a whole object, sanitize to only include
          // fields the enrollment endpoint expects/editable. Sending the
          // entire object (including id, created_at, lead, etc.) can
          // trigger backend validation 400s.
          const allowed = new Set([
            "student_name",
            "parents_name",
            "email",
            "phone_number",
            "course",
            "batchname",
            "batch_name",
            "assigned_teacher",
            "course_duration",
            "starting_date",
            "total_payment",
            "first_installment",
            "second_installment",
            "third_installment",
            "last_pay_date",
            "payment_completed",
            "remarks",
            // allow enrollment/lead-level demo scheduling and shift edits
            "demo_scheduled",
            "scheduled_taken",
            "payment_type",
            "shift",
            "invoice",
          ]);
          const obj = { ...(value || {}) };
          // Normalize possible key variants
          if (obj.batch_name && !obj.batchname) obj.batchname = obj.batch_name;
          // Build sanitized payload
          payload = {};
          for (const [k, v] of Object.entries(obj)) {
            if (!allowed.has(k)) continue;
            // skip undefined fields
            if (v === undefined) continue;
            // coerce numeric-like strings to numbers for payment fields
            if (
              [
                "total_payment",
                "first_installment",
                "second_installment",
                "third_installment",
              ].includes(k) &&
              (typeof v === "string" || typeof v === "number")
            ) {
              const n = Number(v);
              payload[k] = Number.isFinite(n) ? n : null;
              continue;
            }
            // backend sometimes stores invoice as a single string url
            if (k === "invoice") {
              if (!v) continue;
              if (typeof v === "string") {
                // convert single URL to array of invoice entries
                payload.invoice = [{ name: "", url: v, date: "", file: null }];
                continue;
              }
              if (Array.isArray(v)) {
                // ensure each entry is an object with expected keys
                payload.invoice = v
                  .map((inv) => {
                    if (!inv) return null;
                    if (typeof inv === "string")
                      return { name: "", url: inv, date: "", file: null };
                    return {
                      name: inv.name || "",
                      url: inv.url || inv.file?.previewUrl || "",
                      date: inv.date || "",
                      file: inv.file || null,
                    };
                  })
                  .filter(Boolean);
                continue;
              }
            }
            payload[k] = v;
          }
          // If the modal passed nested lead fields (lead.scheduled_taken / legacy lead.demo_scheduled / lead.device / lead.shift),
          // mirror them to top-level payload fields because the enrollments API
          // commonly expects these at the enrollment root.
          try {
            const leadObj = value.lead || {};
            if (leadObj.scheduled_taken !== undefined) {
              payload.scheduled_taken = leadObj.scheduled_taken;
            } else if (leadObj.demo_scheduled !== undefined) {
              payload.scheduled_taken = leadObj.demo_scheduled; // legacy
            }
            if (leadObj.shift !== undefined) {
              payload.shift = leadObj.shift;
            }
            if (leadObj.device !== undefined) {
              // device may be "Yes"/"No" or boolean; preserve string for now and
              // let the outer normalization convert it before sending.
              payload.device = leadObj.device;
            }
          } catch (e) {
            // ignore
          }
          // Legacy top-level demo_scheduled mapping if present
          if (
            payload.demo_scheduled !== undefined &&
            payload.scheduled_taken === undefined
          ) {
            payload.scheduled_taken = payload.demo_scheduled;
          }
          // If payment_type provided inside nested lead (unlikely) mirror up
          try {
            const leadObj = value.lead || {};
            if (
              leadObj.payment_type !== undefined &&
              payload.payment_type === undefined
            ) {
              payload.payment_type = leadObj.payment_type;
            }
          } catch (e) {}
        } else {
          // Single-field updates
          // If this was a lead.* field, send nested lead object to the server
          if (field && field.startsWith("lead.")) {
            const leadKey = backendField; // already stripped above
            payload = { lead: { [leadKey]: value } };
          } else {
            payload = { [backendField]: value };
          }

          // If updating assigned_teacher from dropdown we may have both id and label
          if (
            backendField === "assigned_teacher" &&
            value &&
            typeof value === "object"
          ) {
            // Expect shape { id, name }
            if (value.id !== undefined) payload.assigned_teacher = value.id;
            // keep a parallel name for optimistic UI (even if backend doesn't store it)
            payload.assigned_teacher_name = value.name || value.label || "";
          }

          // Type coercion for single-field updates
          if (
            payload.course &&
            typeof payload.course === "string" &&
            /^\d+$/.test(payload.course)
          ) {
            payload.course = parseInt(payload.course, 10);
          }
          if (paymentFields.has(backendField)) {
            // coerce numeric payment fields
            const v = payload[backendField];
            if (v === null || v === undefined || v === "") {
              payload[backendField] = null;
            } else {
              const n = Number(v);
              payload[backendField] = Number.isFinite(n)
                ? n
                : payload[backendField];
            }
          }
          if (backendField === "payment_completed") {
            const val = payload[backendField];
            if (typeof val === "string") {
              const vv = val.toLowerCase();
              payload[backendField] =
                vv === "true" || vv === "yes" || vv === "1";
            } else {
              payload[backendField] = !!val;
            }
          }
        }

        // Payment logic
        const todayDate = new Date().toISOString().split("T")[0];
        const paymentChanged =
          backendField === "payment_completed" ||
          paymentFields.has(backendField) ||
          (field === null &&
            value &&
            (paymentFields.has("total_payment") ||
              paymentFields.has("first_installment")));

        if (paymentChanged) {
          if (
            payload.payment_completed === true ||
            paymentFields.has(backendField) ||
            (field === null &&
              (payload.total_payment ||
                payload.first_installment ||
                payload.second_installment ||
                payload.third_installment))
          ) {
            payload.last_pay_date = payload.last_pay_date || todayDate;
          }
        }

        // If payload contains File objects for invoice uploads, send as multipart/form-data
        // Coerce course objects to id when present
        if (payload && payload.course && typeof payload.course === "object") {
          if (payload.course.id !== undefined)
            payload.course = payload.course.id;
          else if (payload.course.value !== undefined)
            payload.course = payload.course.value;
        }

        // Ensure payment_completed is boolean
        if (payload && payload.payment_completed !== undefined) {
          if (typeof payload.payment_completed === "string") {
            const v = payload.payment_completed.toLowerCase();
            payload.payment_completed =
              v === "true" || v === "yes" || v === "1";
          } else {
            payload.payment_completed = !!payload.payment_completed;
          }
        }

        let response;

        // Normalize scheduled_taken (legacy demo_scheduled) values: backend expects "Yes"/"No" strings
        // Convert boolean true/false to "Yes"/"No" strings where present
        try {
          const normalizeYesNo = (v) => {
            if (v === undefined || v === null) return v;
            if (typeof v === "boolean") return v ? "Yes" : "No";
            const s = String(v).trim().toLowerCase();
            if (s === "yes" || s === "true") return "Yes";
            if (s === "no" || s === "false") return "No";
            // If it's an empty string, return null so backend will treat as cleared
            if (s === "") return null;
            // Return "Yes" or "No" for any other truthy/falsy values
            return v ? "Yes" : "No";
          };

          if (payload && payload.scheduled_taken !== undefined) {
            payload.scheduled_taken = normalizeYesNo(payload.scheduled_taken);
          }
          if (payload && payload.lead) {
            if (payload.lead.scheduled_taken !== undefined) {
              payload.lead.scheduled_taken = normalizeYesNo(
                payload.lead.scheduled_taken
              );
              if (
                payload.lead.scheduled_taken !== null &&
                payload.lead.scheduled_taken !== undefined
              ) {
                payload.scheduled_taken = payload.lead.scheduled_taken;
              }
            } else if (payload.lead.demo_scheduled !== undefined) {
              const norm = normalizeYesNo(payload.lead.demo_scheduled);
              payload.lead.scheduled_taken = norm;
              if (norm !== null && norm !== undefined) {
                payload.scheduled_taken = norm;
              }
              delete payload.lead.demo_scheduled;
            }
          }
        } catch (e) {
          // normalization should not block saving; ignore on error
          console.debug("scheduled_taken normalization failed:", e);
        }

        // Decide method: if full-object (modal) update and touching any of key fields, use PUT
        let method = "PATCH";
        if (
          field === null &&
          (Object.prototype.hasOwnProperty.call(payload, "scheduled_taken") ||
            Object.prototype.hasOwnProperty.call(payload, "payment_type") ||
            Object.prototype.hasOwnProperty.call(payload, "course_duration"))
        ) {
          method = "PUT";
        }

        // If using PUT, build a full representation to avoid unintentionally clearing fields
        if (method === "PUT") {
          try {
            const current = prevStudents.find(
              (s) => String(s.id) === String(studentId)
            );
            if (current) {
              const editable = [
                "student_name",
                "parents_name",
                "email",
                "phone_number",
                "course",
                "batchname",
                "assigned_teacher",
                "course_duration",
                "starting_date",
                "total_payment",
                "first_installment",
                "second_installment",
                "third_installment",
                "last_pay_date",
                "payment_completed",
                "remarks",
                "scheduled_taken",
                "payment_type",
                "shift",
              ];
              const fullPayload = {};
              editable.forEach((k) => {
                if (payload[k] !== undefined) fullPayload[k] = payload[k];
                else if (current[k] !== undefined) fullPayload[k] = current[k];
                else if (current.lead && current.lead[k] !== undefined)
                  fullPayload[k] = current.lead[k];
              });
              payload = fullPayload;
            }
          } catch (e) {
            console.warn("Failed to construct full PUT payload", e);
          }
        }

        try {
          console.debug("Enrollment update outgoing", {
            method,
            url: `${ENROLLMENTS_API_BASE}${studentId}/`,
            payload,
          });
        } catch (e) {}
        const hasInvoiceFiles =
          payload &&
          Array.isArray(payload.invoice) &&
          payload.invoice.some((inv) => inv && inv.file instanceof File);

        // If invoice exists but contains no File objects, omit it to avoid
        // sending an array structure that the backend may not accept.
        if (payload && Array.isArray(payload.invoice) && !hasInvoiceFiles) {
          // If there's exactly one entry with a URL and the user likely didn't change it,
          // don't include invoice in the payload so backend keeps existing value.
          delete payload.invoice;
        }

        if (hasInvoiceFiles) {
          const fd = new FormData();
          // Build invoice metadata array to send alongside files so backend
          // can associate names/dates with uploaded files. Entries without a
          // file but with an existing url will be included as-is.
          const invoiceMeta = [];
          payload.invoice.forEach((inv, idx) => {
            const meta = {
              name: inv.name || (inv.file && inv.file.name) || "",
              date: inv.date || "",
              url: inv.url || "",
              index: idx,
            };
            invoiceMeta.push(meta);
            if (inv && inv.file instanceof File) {
              // append files under the 'invoice' field (backend typically
              // maps file uploads to the model field name). Send multiple
              // entries named 'invoice' to support multiple files.
              fd.append("invoice", inv.file, inv.file.name);
            }
          });

          // Append other payload fields. For objects/arrays append JSON string.
          for (const [k, v] of Object.entries(payload)) {
            if (k === "invoice") continue; // already handled
            if (v === null || v === undefined) continue;
            if (typeof v === "object") fd.append(k, JSON.stringify(v));
            else fd.append(k, String(v));
          }

          fd.append("invoice_metadata", JSON.stringify(invoiceMeta));

          // Use the explicit enrollments API base for uploads (backend expects this path)
          const enrollmentsApiBase =
            "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/enrollments/";
          response = await fetch(`${enrollmentsApiBase}${studentId}/`, {
            method: "PATCH",
            headers: {
              Authorization: `Token ${authToken}`,
              // NOTE: do NOT set Content-Type; browser will set multipart boundary
            },
            body: fd,
            credentials: "include",
          });
        } else {
          // Determine if this is a lead field or enrollment field
          const currentStudent = allStudents.find(
            (s) => String(s.id) === String(studentId)
          );
          const isLeadField =
            field &&
            (field.startsWith("lead.") ||
              // Lead fields that might be updated directly
              [
                "student_name",
                "parents_name",
                "email",
                "phone_number",
                "age",
                "grade",
                "status",
                "substatus",
                "course_type",
                "shift",
                "previous_coding_experience",
                "last_call",
                "next_call",
                "value",
                "adset_name",
                "payment_type",
                "device",
                "school_college_name",
                "remarks",
                "address_line_1",
                "address_line_2",
                "city",
                "country",
                "post_code",
                "source",
                "class_type",
                "lead_type",
                "course",
                "scheduled_taken",
                "whatsapp_number",
              ].includes(backendField));

          // Force these fields to always go to enrollment API regardless of field name
          const enrollmentOnlyFields = [
            "course_duration", // This should be enrollment-specific, not lead
            "batchname",
            "batch_name",
            "assigned_teacher",
            "assigned_teacher_name",
            "total_payment",
            "first_installment",
            "second_installment",
            "third_installment",
            "payment_completed",
            "starting_date",
            "last_pay_date",
            "next_pay_date",
            "course",
            "invoice",
          ];

          const isEnrollmentOnlyField =
            enrollmentOnlyFields.includes(backendField);
          const shouldUseLeadsAPI =
            isLeadField && !isEnrollmentOnlyField && currentStudent?.lead?.id;

          let apiUrl, targetId;
          if (shouldUseLeadsAPI) {
            // Lead field - send to leads API
            apiUrl = `${BASE_URL}/leads/${currentStudent.lead.id}/`;
            targetId = currentStudent.lead.id;
          } else {
            // Enrollment field - send to enrollments API
            apiUrl = `${ENROLLMENTS_API_BASE}${studentId}/`;
            targetId = studentId;
          }

          // Debug logging
          console.log("API Routing Debug:", {
            field,
            backendField,
            isLeadField,
            isEnrollmentOnlyField,
            shouldUseLeadsAPI,
            hasLeadId: !!currentStudent?.lead?.id,
            apiUrl,
            payload,
          });

          response = await fetch(apiUrl, {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(payload),
            credentials: "include",
          });
        }
        if (!response.ok) {
          // Retry 1: scheduled_taken boolean -> "Yes" / "No" (fallback safety)
          if (
            response.status === 400 &&
            payload &&
            Object.prototype.hasOwnProperty.call(payload, "scheduled_taken") &&
            typeof payload.scheduled_taken === "boolean"
          ) {
            try {
              const retryPayload = {
                ...payload,
                scheduled_taken: payload.scheduled_taken ? "Yes" : "No",
              };
              const retryResp = await fetch(
                apiUrl, // Use the same API URL determined above
                {
                  method,
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                  },
                  body: JSON.stringify(retryPayload),
                  credentials: "include",
                }
              );
              if (retryResp.ok) response = retryResp;
            } catch (e) {
              console.debug("scheduled_taken retry failed", e);
            }
          }
          // Retry 2: payment_type needs nested lead
          if (
            !response.ok &&
            response.status === 400 &&
            payload &&
            Object.prototype.hasOwnProperty.call(payload, "payment_type") &&
            !payload.lead
          ) {
            try {
              const retryPayload = {
                ...payload,
                lead: { payment_type: payload.payment_type },
              };
              const retryResp = await fetch(
                apiUrl, // Use the same API URL determined above
                {
                  method,
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                  },
                  body: JSON.stringify(retryPayload),
                  credentials: "include",
                }
              );
              if (retryResp.ok) response = retryResp;
            } catch (e) {
              console.debug("payment_type nested retry failed", e);
            }
          }
          // Retry 3: course_duration needs nested lead
          if (
            !response.ok &&
            response.status === 400 &&
            payload &&
            Object.prototype.hasOwnProperty.call(payload, "course_duration") &&
            !payload.lead
          ) {
            try {
              const retryPayload = {
                ...payload,
                lead: { course_duration: payload.course_duration },
              };
              const retryResp = await fetch(
                apiUrl, // Use the same API URL determined above
                {
                  method,
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                  },
                  body: JSON.stringify(retryPayload),
                  credentials: "include",
                }
              );
              if (retryResp.ok) response = retryResp;
            } catch (e) {
              console.debug("course_duration nested retry failed", e);
            }
          }
        }
        if (!response.ok) {
          let errorText = await response.text();
          let errorData = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { detail: errorText };
          }
          // rollback optimistic update
          setAllStudents(prevStudents);
          // Show error in UI and log full response
          setError(
            `Failed to update enrollment: ${
              errorData.detail || response.statusText
            }`
          );

          // Determine the URL that was used for the request based on context
          let requestUrl;
          if (hasInvoiceFiles) {
            // For file uploads, reconstruct the URL that was used
            requestUrl = `${ENROLLMENTS_API_BASE}${studentId}/`;
          } else if (typeof apiUrl !== "undefined") {
            // Use the apiUrl from the non-file branch if it's defined
            requestUrl = apiUrl;
          } else {
            // Fallback
            requestUrl = `${ENROLLMENTS_API_BASE}${studentId}/`;
          }

          console.error("Enrollment update error details:", {
            method,
            url: requestUrl,
            payload,
            status: response.status,
            response: errorData,
          });
          return;
        }
        // Refetch enrollment data after successful update
        const respJson = await response.json().catch(() => null);
        // Merge server response into local state so UI reflects server-normalized values
        if (respJson) {
          setAllStudents((prev) =>
            (prev || []).map((s) =>
              String(s.id) === String(studentId)
                ? {
                    ...s,
                    ...respJson,
                    // keep nested lead merged when server returned enrollment-only fields
                    lead: {
                      ...(s.lead || {}),
                      ...(respJson.lead || {}),
                    },
                    // Mirror teacher name if backend returns only id
                    ...(respJson.assigned_teacher &&
                    !respJson.assigned_teacher_name
                      ? {
                          assigned_teacher_name: (function () {
                            try {
                              const match = (teachers || []).find(
                                (t) =>
                                  String(t.id) ===
                                  String(respJson.assigned_teacher)
                              );
                              return match
                                ? match.name
                                : s.assigned_teacher_name;
                            } catch (e) {
                              return s.assigned_teacher_name;
                            }
                          })(),
                        }
                      : {}),
                  }
                : s
            )
          );

          // Emit events so other parts of app (leads changelog, leads list)
          // can update immediately.
          try {
            window.dispatchEvent(
              new CustomEvent("crm:enrollmentUpdated", {
                detail: { enrollment: respJson },
              })
            );

            // Emit crm:leadUpdated with both shapes (lead object + meta) for compatibility
            const emittedLead = respJson.lead || null;
            const meta = {
              id: emittedLead?.id || respJson?.id || studentId,
              field_changed: backendField,
              old_value: undefined,
              new_value: undefined,
              lead: emittedLead || undefined,
            };
            // try to infer old/new for this field from payload
            try {
              meta.old_value = prevStudents.find(
                (x) => String(x.id) === String(studentId)
              )?.[backendField];
              meta.new_value =
                respJson[backendField] ??
                (respJson.lead && respJson.lead[backendField]) ??
                payload[backendField] ??
                value;
            } catch (e) {}

            window.dispatchEvent(
              new CustomEvent("crm:leadUpdated", { detail: meta })
            );
          } catch (e) {
            console.debug("Failed to emit enrollment/lead updated events", e);
          }
        }

        // Show success toast notification
        const fieldDisplayName =
          backendField === "payment_completed"
            ? "Payment Status"
            : backendField === "assigned_teacher"
            ? "Assigned Teacher"
            : backendField === "course_duration"
            ? "Course Duration"
            : backendField === "scheduled_taken"
            ? "Demo Scheduled"
            : backendField === "batchname"
            ? "Batch Name"
            : field === null
            ? "Student Information"
            : backendField.charAt(0).toUpperCase() +
              backendField.slice(1).replace(/_/g, " ");

        setToast({
          show: true,
          message: `${fieldDisplayName} updated successfully`,
          type: "success",
        });

        setError(null);
        // Return parsed JSON so callers (modal) can react to updated invoice URLs
        return respJson;
      } catch (err) {
        // rollback optimistic update
        try {
          setAllStudents((prev) => prevStudents || prev);
        } catch (e) {}
        setError(`Error updating student: ${err.message}`);
        console.error(`Error updating student ${field}:`, err);
      }
    },
    [authToken, fetchEnrolledStudents, currentPage, teachers]
  );

  // Payment status update
  const handleUpdatePaymentStatus = useCallback(
    async (studentId, newStatus) => {
      handleUpdateField(studentId, "payment_completed", newStatus);
    },
    [handleUpdateField]
  );

  // Open edit modal for a student
  const handleEdit = useCallback((student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingStudent(null);
  }, []);

  // Delete a single enrollment
  const handleDelete = useCallback(
    async (studentId) => {
      if (!window.confirm("Are you sure you want to delete this enrollment?"))
        return;
      try {
        const resp = await fetch(`${BASE_URL}/enrollments/${studentId}/`, {
          method: "DELETE",
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });
        if (!resp.ok) {
          let errorBody = null;
          try {
            errorBody = await resp.json();
          } catch (e) {
            try {
              errorBody = await resp.text();
            } catch (e2) {
              errorBody = null;
            }
          }
          const detailMsg =
            (errorBody && errorBody.detail) ||
            (typeof errorBody === "string" && errorBody) ||
            resp.statusText;
          setError(`Failed to delete enrollment: ${detailMsg}`);
          console.error("DELETE error details:", {
            url: `${BASE_URL}/enrollments/${studentId}/`,
            status: resp.status,
            response: errorBody,
          });
          return;
        }
        setAllStudents((prev) => prev.filter((s) => s.id !== studentId));
        fetchEnrolledStudents(currentPage);
      } catch (err) {
        console.error("Failed to delete enrollment:", err);
        setError(err.message || "Failed to delete enrollment");
      }
    },
    [authToken, fetchEnrolledStudents, currentPage]
  );

  // Bulk delete enrollments
  const handleBulkDelete = useCallback(
    async (ids = []) => {
      if (!ids || ids.length === 0) return;
      if (!window.confirm(`Permanently delete ${ids.length} enrollments?`))
        return;
      try {
        await Promise.all(
          ids.map((id) =>
            fetch(`${BASE_URL}/enrollments/${id}/`, {
              method: "DELETE",
              headers: { Authorization: `Token ${authToken}` },
              credentials: "include",
            })
          )
        );
        setAllStudents((prev) => prev.filter((s) => !ids.includes(s.id)));
        fetchEnrolledStudents(currentPage);
      } catch (err) {
        console.error("Bulk delete failed:", err);
        setError("Failed to delete some enrollments.");
        fetchEnrolledStudents(currentPage);
      }
    },
    [authToken, fetchEnrolledStudents, currentPage]
  );

  // Show full-screen delayed loader only on the very first load. For
  // subsequent background fetches (e.g. debounce-driven) keep the table
  // visible and avoid sudden re-render/replace.
  if (initialLoad)
    return (
      <DelayedLoader message="Loading enrolled students..." minMs={2000} />
    );

  if (error)
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded-md">
        Error: {error}
      </div>
    );

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Enrolled Students</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Filter Enrolled Students:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Student Name or Email
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Payment Date
            </label>
            <input
              type="date"
              value={searchLastPaymentDate}
              onChange={(e) => setSearchLastPaymentDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={filterPaymentNotCompleted}
              onChange={(e) => setFilterPaymentNotCompleted(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm font-medium text-gray-700">
              Payment Not Completed
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Demo Taken
            </label>
            <select
              value={filterScheduledTaken}
              onChange={(e) => setFilterScheduledTaken(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            >
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExportEnrollments}
              disabled={loading}
              className={`px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                // smooth clear: reset filter states and go to page 1
                setSearchQuery("");
                setSearchLastPaymentDate("");
                setFilterPaymentNotCompleted(false);
                setFilterScheduledTaken("");
                // set page to 1 and fetch fresh data
                setCurrentPage(1);
                // call fetch directly for immediate feedback
                fetchEnrolledStudents(1);
              }}
              disabled={loading}
              className={`ml-3 px-4 py-2 rounded-md border bg-blue-700 text-white hover:bg-blue-600 transition-opacity duration-200 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <EnrolledStudentsTable
          students={filteredStudents}
          courses={courses}
          teachers={teachers}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleBulkDelete={handleBulkDelete}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onUpdateField={handleUpdateField}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>

      {/* Pagination controls (arrow + Page X of Y style) */}
      <div className="flex justify-end items-center mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <span className="mx-4 text-sm font-medium text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingStudent && (
        <EnrolledStudentEditModal
          student={editingStudent}
          teachers={teachers}
          onClose={handleCloseModal}
          onSave={async (updatedStudent) => {
            const resp = await handleUpdateField(
              updatedStudent.id,
              null,
              updatedStudent
            );
            if (resp) {
              // close modal and show toast
              setIsModalOpen(false);
              setEditingStudent(null);
              setToast({
                show: true,
                message: "Updated successfully",
                type: "success",
              });
              // auto-hide toast after 3s (Toast component also does this but keep state tidy)
              setTimeout(
                () => setToast({ show: false, message: "", type: "success" }),
                3000
              );
            }
            return resp;
          }}
        />
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast({ show: false, message: "", type: "success" })
          }
        />
      )}
    </div>
  );
};

export default EnrolledStudents;
