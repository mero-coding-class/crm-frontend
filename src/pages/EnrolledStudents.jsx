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
  // Keep export progress separate from table loading to avoid flicker
  const [exporting, setExporting] = useState(false);

  // Refs for debounced server filter fetching
  const searchQueryRef = useRef(searchQuery);
  const searchLastPaymentDateRef = useRef(searchLastPaymentDate);
  const filterPaymentNotCompletedRef = useRef(filterPaymentNotCompleted);
  const filterScheduledTakenRef = useRef(filterScheduledTaken);
  // Ref to access handleUpdateField inside early effects without TDZ
  const handleUpdateFieldRef = useRef(null);
  // Ref to always read the latest students list inside event handlers
  const allStudentsRef = useRef(allStudents);

  useEffect(() => {
    allStudentsRef.current = allStudents;
  }, [allStudents]);

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

    // Bridge: listen for invoices added from lead edit and upload to enrollment
    const onLeadInvoicesSelected = async (e) => {
      try {
        const detail = e?.detail || {};
        const leadId = detail.leadId;
        const files = detail.files || [];
        if (!leadId || !files.length) return;
        const target = (allStudentsRef.current || []).find(
          (s) =>
            s?.lead &&
            (String(s.lead.id) === String(leadId) ||
              String(s.lead._id) === String(leadId))
        );
        if (!target) return;
        const today = new Date().toISOString().split("T")[0];
        const invoice = files.map((file) => ({
          name: file.name,
          date: today,
          file,
        }));
        const fn = handleUpdateFieldRef.current;
        if (typeof fn === "function") {
          await fn(target.id, "invoice", { invoice });
        }
        await fetchEnrolledStudents(currentPage);
      } catch (err) {
        console.debug("onLeadInvoicesSelected failed", err);
      }
    };
    window.addEventListener("crm:leadInvoicesSelected", onLeadInvoicesSelected);

    // React to conversion or manual refresh requests by fetching current page
    const onLeadConverted = () => {
      try {
        fetchEnrolledStudents(currentPage);
      } catch {}
    };
    const onRefreshEnrollments = () => {
      try {
        fetchEnrolledStudents(currentPage);
      } catch {}
    };
    window.addEventListener("crm:leadConverted", onLeadConverted);
    window.addEventListener("crm:refreshEnrollments", onRefreshEnrollments);

    return () => {
      window.removeEventListener("crm:imported", onImported);
      window.removeEventListener(
        "crm:leadInvoicesSelected",
        onLeadInvoicesSelected
      );
      window.removeEventListener("crm:leadConverted", onLeadConverted);
      window.removeEventListener(
        "crm:refreshEnrollments",
        onRefreshEnrollments
      );
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
    // Listen for explicit first_installment updates coming from Leads
    const onLeadFI = (e) => {
      try {
        const leadId = e?.detail?.leadId;
        const fi = e?.detail?.first_installment;
        if (!leadId) return;
        setAllStudents((prev) =>
          (prev || []).map((s) =>
            s?.lead && String(s.lead.id) === String(leadId)
              ? { ...s, lead: { ...(s.lead || {}), first_installment: fi } }
              : s
          )
        );
      } catch {}
    };
    window.addEventListener("crm:leadFirstInstallmentUpdated", onLeadFI);
    return () => {
      window.removeEventListener("crm:leadUpdated", onLeadUpdated);
      window.removeEventListener("crm:leadFirstInstallmentUpdated", onLeadFI);
    };
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
    if (!authToken || exporting) return;
    setExporting(true);
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
      setExporting(false);
    }
  }, [
    authToken,
    exporting,
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
          // Strictly split modal save into two payloads to avoid 400s on enrollment endpoint
          const obj = { ...(value || {}) };
          const current = prevStudents.find(
            (s) => String(s.id) === String(studentId)
          );
          const leadId = current?.lead?.id;

          // Normalize possible key variants
          if (obj.batch_name && !obj.batchname) obj.batchname = obj.batch_name;

          // Enrollment-allowed fields only
          const enrollmentAllowed = new Set([
            "course",
            "batchname",
            "assigned_teacher",
            "starting_date",
            "total_payment",
            "second_installment",
            "third_installment",
            "last_pay_date",
            "next_pay_date",
            "payment_completed",
            "remarks",
          ]);
          const enrollmentPayload = {};
          for (const [k, vRaw] of Object.entries(obj)) {
            if (!enrollmentAllowed.has(k)) continue;
            if (vRaw === undefined) continue;
            let v = vRaw;
            // Coercions
            if (k === "course") {
              if (v && typeof v === "object" && v.id !== undefined) v = v.id;
              if (typeof v === "string" && /^\d+$/.test(v)) v = parseInt(v, 10);
            }
            if (
              [
                "total_payment",
                "second_installment",
                "third_installment",
              ].includes(k)
            ) {
              if (v === null || v === "") v = null;
              else {
                const n = Number(v);
                v = Number.isFinite(n) ? n : null;
              }
            }
            if (k === "assigned_teacher" && typeof v === "object") {
              if (v.id !== undefined) v = v.id;
            }
            if (k === "payment_completed") {
              if (typeof v === "string") {
                const s = v.toLowerCase();
                v = s === "true" || s === "yes" || s === "1";
              } else v = !!v;
            }
            // Dates to YYYY-MM-DD
            if (
              ["starting_date", "last_pay_date", "next_pay_date"].includes(k) &&
              v
            ) {
              try {
                v = String(v).split("T")[0];
              } catch {}
            }
            enrollmentPayload[k] = v;
          }

          // Auto last_pay_date when payment-related fields present
          const paymentKeys = [
            "total_payment",
            "second_installment",
            "third_installment",
            "payment_completed",
          ];
          if (
            paymentKeys.some((k) =>
              Object.prototype.hasOwnProperty.call(enrollmentPayload, k)
            )
          ) {
            const today = new Date().toISOString().split("T")[0];
            if (!enrollmentPayload.last_pay_date)
              enrollmentPayload.last_pay_date = today;
          }

          // Lead payload from nested lead or top-level fallbacks
          const leadAllowed = new Set([
            "student_name",
            "parents_name",
            "email",
            "phone_number",
            "whatsapp_number",
            "grade",
            "source",
            "class_type",
            "lead_type",
            "shift",
            "previous_coding_experience",
            "last_call",
            "next_call",
            "value",
            "adset_name",
            "course_duration",
            "payment_type",
            "device",
            "school_college_name",
            "address_line_1",
            "address_line_2",
            "city",
            "county",
            "post_code",
            "scheduled_taken",
            "first_installment",
            "remarks",
          ]);
          const leadPayload = {};
          const leadSrc = { ...(obj.lead || {}), ...obj };
          for (const [k, vRaw] of Object.entries(leadSrc)) {
            if (!leadAllowed.has(k)) continue;
            if (vRaw === undefined) continue;
            let v = vRaw;
            if (k === "scheduled_taken") {
              const s = String(v).trim().toLowerCase();
              if (s === "true" || s === "yes") v = "Yes";
              else if (s === "false" || s === "no") v = "No";
            }
            if (k === "first_installment") {
              if (v === null || v === "") v = null;
              else {
                const n = Number(v);
                v = Number.isFinite(n) ? n : v;
              }
            }
            leadPayload[k] = v;
          }

          // Handle invoice files for enrollment
          const hasSecondFile =
            value && value.second_invoice_file instanceof File;
          const hasThirdFile =
            value && value.third_invoice_file instanceof File;
          const hasInvoiceFiles = hasSecondFile || hasThirdFile;

          // Send to enrollment first (only if there are enrollment changes or invoice files)
          let enrollmentRespJson = null;
          try {
            const enrollUrl = `${ENROLLMENTS_API_BASE}${studentId}/`;
            let resp;
            const hasEnrollmentChanges =
              Object.keys(enrollmentPayload).length > 0;
            if (hasInvoiceFiles) {
              const fd = new FormData();
              for (const [k, v] of Object.entries(enrollmentPayload)) {
                if (v === undefined || v === null) continue;
                fd.append(
                  k,
                  typeof v === "object" ? JSON.stringify(v) : String(v)
                );
              }
              if (hasSecondFile)
                fd.append("second_invoice", value.second_invoice_file);
              if (hasThirdFile)
                fd.append("third_invoice", value.third_invoice_file);
              resp = await fetch(enrollUrl, {
                method: "PATCH",
                headers: { Authorization: `Token ${authToken}` },
                body: fd,
                credentials: "include",
              });
            } else if (hasEnrollmentChanges) {
              resp = await fetch(enrollUrl, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify(enrollmentPayload),
                credentials: "include",
              });
            } else {
              resp = null; // no enrollment changes to send
            }
            if (resp && !resp.ok) {
              let t = await resp.text();
              let d = {};
              try {
                d = JSON.parse(t);
              } catch {
                d = { detail: t };
              }
              // rollback optimistic update
              setAllStudents(prevStudents);
              setError(
                `Failed to update enrollment: ${d.detail || resp.statusText}`
              );
              console.error("Enrollment (modal) update error:", {
                url: enrollUrl,
                status: resp.status,
                payload: enrollmentPayload,
                response: d,
              });
              return;
            }
            enrollmentRespJson = resp
              ? await resp.json().catch(() => null)
              : null;
          } catch (e) {
            setAllStudents(prevStudents);
            setError(`Failed to update enrollment: ${e.message || e}`);
            console.error("Enrollment (modal) update exception:", e);
            return;
          }

          // Then send lead payload if any fields exist and we have a lead id
          let leadRespJson = null;
          if (leadId && Object.keys(leadPayload).length > 0) {
            try {
              const leadUrl = `${BASE_URL}/leads/${leadId}/`;
              const lresp = await fetch(leadUrl, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify(leadPayload),
                credentials: "include",
              });
              if (lresp.ok) {
                leadRespJson = await lresp.json().catch(() => null);
              } else {
                let lt = await lresp.text();
                let ld = {};
                try {
                  ld = JSON.parse(lt);
                } catch {
                  ld = { detail: lt };
                }
                console.warn("Lead (modal) patch failed (non-blocking):", {
                  url: leadUrl,
                  status: lresp.status,
                  payload: leadPayload,
                  response: ld,
                });
              }
            } catch (e) {
              console.warn("Lead (modal) patch exception (non-blocking)", e);
            }
          }

          // Merge responses locally
          if (enrollmentRespJson || leadRespJson) {
            setAllStudents((prev) =>
              (prev || []).map((s) => {
                if (String(s.id) !== String(studentId)) return s;
                let merged = { ...s };
                if (enrollmentRespJson) {
                  merged = {
                    ...merged,
                    ...enrollmentRespJson,
                    lead: {
                      ...(merged.lead || {}),
                      ...(enrollmentRespJson.lead || {}),
                    },
                  };
                }
                if (leadRespJson) {
                  merged = {
                    ...merged,
                    lead: { ...(merged.lead || {}), ...leadRespJson },
                  };
                }
                return merged;
              })
            );
          }

          // Emit events
          try {
            if (enrollmentRespJson) {
              window.dispatchEvent(
                new CustomEvent("crm:enrollmentUpdated", {
                  detail: { enrollment: enrollmentRespJson },
                })
              );
            }
            if (leadRespJson) {
              window.dispatchEvent(
                new CustomEvent("crm:leadUpdated", {
                  detail: { lead: leadRespJson },
                })
              );
            }
          } catch {}

          // Toast (no extra refresh here; we already merged response)
          setToast({
            show: true,
            message: "Student Information updated successfully",
            type: "success",
          });
          setError(null);

          // Return enrollment response (used by modal to show invoice URLs)
          return enrollmentRespJson;
        } else {
          // Single-field updates
          // If this was a lead.* field, send nested lead object to the server
          if (field && field.startsWith("lead.")) {
            const leadKey = backendField; // already stripped above
            payload = { lead: { [leadKey]: value } };
          } else {
            // Build payload; routing to Leads vs Enrollments decided later
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
          if (
            paymentFields.has(backendField) &&
            backendField !== "first_installment"
          ) {
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

        // Do not attach last_pay_date when we are updating only lead.first_installment via Leads API
        const isLeadFirstInstallmentOnly =
          backendField === "first_installment" && field !== null;

        if (paymentChanged && !isLeadFirstInstallmentOnly) {
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

        // Decide method
        let method = "PATCH";

        try {
          console.debug("Enrollment update outgoing", {
            method,
            url: `${ENROLLMENTS_API_BASE}${studentId}/`,
            payload,
          });
        } catch (e) {}
        // Detect explicit second/third invoice files passed from modal
        const hasSecondFile =
          value && value.second_invoice_file instanceof File;
        const hasThirdFile = value && value.third_invoice_file instanceof File;
        const hasInvoiceFiles = hasSecondFile || hasThirdFile;

        if (hasInvoiceFiles) {
          const fd = new FormData();
          // append the known enrollment fields
          for (const [k, v] of Object.entries(payload)) {
            if (v === null || v === undefined) continue;
            if (typeof v === "object") fd.append(k, JSON.stringify(v));
            else fd.append(k, String(v));
          }
          // Append invoice files with field names matching backend model fields
          if (hasSecondFile)
            fd.append("second_invoice", value.second_invoice_file);
          if (hasThirdFile)
            fd.append("third_invoice", value.third_invoice_file);

          // Use the explicit enrollments API base for uploads (backend expects this path)
          const enrollmentsApiBase = ENROLLMENTS_API_BASE;
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
          // Try multiple shapes to resolve a usable lead id for Leads API routing
          const resolvedLeadId =
            (currentStudent &&
              (currentStudent.lead?.id ??
                currentStudent.lead?._id ??
                currentStudent.leadId ??
                currentStudent.lead?.lead_id)) ||
            null;
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
                "course_duration",
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
                "first_installment",
              ].includes(backendField));

          // Force these fields to always go to enrollment API regardless of field name
          const enrollmentOnlyFields = [
            "batchname",
            "batch_name",
            "assigned_teacher",
            "assigned_teacher_name",
            "total_payment",
            "second_installment",
            "third_installment",
            "payment_completed",
            "starting_date",
            "last_pay_date",
            "next_pay_date",
            "course",
            "remarks",
            // invoices handled by multipart branch
          ];

          const isEnrollmentOnlyField =
            enrollmentOnlyFields.includes(backendField);
          const shouldUseLeadsAPI =
            isLeadField && !isEnrollmentOnlyField && !!resolvedLeadId;

          // If it's a lead field but we couldn't resolve a lead id, don't fall back to enrollments API.
          if (isLeadField && !resolvedLeadId) {
            // rollback optimistic update
            setAllStudents(prevStudents);
            setError(
              "Cannot update lead field from enrollment row: missing lead id"
            );
            console.warn(
              "Blocked lead field update due to missing lead id",
              backendField,
              { studentId, currentStudent }
            );
            return;
          }

          let apiUrl, targetId;
          if (shouldUseLeadsAPI) {
            // Lead field - send to leads API
            apiUrl = `${BASE_URL}/leads/${resolvedLeadId}/`;
            targetId = resolvedLeadId;
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

          // If routing to Leads API and payload was constructed as nested { lead: {...} },
          // flatten it to the shape expected by the Leads endpoint.
          if (shouldUseLeadsAPI && payload && payload.lead) {
            payload = { ...payload.lead };
          }

          // Ensure first_installment numeric for lead API
          if (shouldUseLeadsAPI && backendField === "first_installment") {
            const v = payload.first_installment;
            payload = {
              first_installment:
                v === null || v === ""
                  ? null
                  : Number.isFinite(Number(v))
                  ? Number(v)
                  : v,
            };
          }

          const usedLeadsAPI = shouldUseLeadsAPI;

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
                typeof apiUrl !== "undefined"
                  ? apiUrl
                  : `${ENROLLMENTS_API_BASE}${studentId}/`,
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
          // Guard against misrouting lead-owned fields to enrollments API in fallbacks
          const leadOwnedForbidEnrollFallback = new Set([
            "payment_type",
            "scheduled_taken",
            "course_duration",
            "first_installment",
            "remarks",
          ]);

          // Retry 2: (disabled for lead-owned fields) payment_type nested lead on enrollments API
          if (
            !response.ok &&
            response.status === 400 &&
            payload &&
            Object.prototype.hasOwnProperty.call(payload, "payment_type") &&
            !payload.lead &&
            !(
              leadOwnedForbidEnrollFallback.has(backendField) ||
              (typeof apiUrl !== "undefined" && apiUrl.includes("/leads/"))
            )
          ) {
            try {
              const retryPayload = {
                ...payload,
                lead: { payment_type: payload.payment_type },
              };
              const retryUrl =
                typeof apiUrl !== "undefined"
                  ? apiUrl
                  : `${ENROLLMENTS_API_BASE}${studentId}/`;
              const retryResp = await fetch(retryUrl, {
                method,
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify(retryPayload),
                credentials: "include",
              });
              if (retryResp.ok) response = retryResp;
            } catch (e) {
              console.debug("payment_type nested retry failed", e);
            }
          }
          // Retry 3: (disabled for lead-owned fields) course_duration nested lead on enrollments API
          if (
            !response.ok &&
            response.status === 400 &&
            payload &&
            Object.prototype.hasOwnProperty.call(payload, "course_duration") &&
            !payload.lead &&
            !(
              leadOwnedForbidEnrollFallback.has(backendField) ||
              (typeof apiUrl !== "undefined" && apiUrl.includes("/leads/"))
            )
          ) {
            try {
              const retryPayload = {
                ...payload,
                lead: { course_duration: payload.course_duration },
              };
              const retryUrl =
                typeof apiUrl !== "undefined"
                  ? apiUrl
                  : `${ENROLLMENTS_API_BASE}${studentId}/`;
              const retryResp = await fetch(retryUrl, {
                method,
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify(retryPayload),
                credentials: "include",
              });
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
          const requestUrl =
            typeof apiUrl !== "undefined"
              ? apiUrl
              : `${ENROLLMENTS_API_BASE}${studentId}/`;

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
            (prev || []).map((s) => {
              if (String(s.id) !== String(studentId)) return s;
              // If we updated via Leads API, only merge into nested lead
              if (typeof apiUrl !== "undefined" && apiUrl.includes("/leads/")) {
                return {
                  ...s,
                  lead: {
                    ...(s.lead || {}),
                    ...(respJson || {}),
                  },
                };
              }
              // Enrollment API merge (existing behavior)
              const merged = {
                ...s,
                ...respJson,
                lead: {
                  ...(s.lead || {}),
                  ...(respJson.lead || {}),
                },
              };
              if (
                respJson.assigned_teacher &&
                !respJson.assigned_teacher_name
              ) {
                try {
                  const match = (teachers || []).find(
                    (t) => String(t.id) === String(respJson.assigned_teacher)
                  );
                  merged.assigned_teacher_name = match
                    ? match.name
                    : s.assigned_teacher_name;
                } catch (e) {
                  merged.assigned_teacher_name = s.assigned_teacher_name;
                }
              }
              return merged;
            })
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
            const emittedLead =
              respJson.lead || (apiUrl.includes("/leads/") ? respJson : null);
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
                (apiUrl.includes("/leads/")
                  ? respJson && respJson[backendField]
                  : respJson[backendField]) ??
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
          duration: 3000,
        });

        setError(null);

        // If this was a full-object (modal) save and it included first_installment,
        // persist it to the Leads API as well so it shows on next open.
        if (
          field === null &&
          value &&
          Object.prototype.hasOwnProperty.call(value, "first_installment")
        ) {
          try {
            const current = prevStudents.find(
              (s) => String(s.id) === String(studentId)
            );
            const leadId = current?.lead?.id;
            if (leadId !== undefined && leadId !== null) {
              const fi = value.first_installment;
              const body = {
                first_installment:
                  fi === null || fi === ""
                    ? null
                    : Number.isFinite(Number(fi))
                    ? Number(fi)
                    : fi,
              };
              const leadResp = await fetch(`${BASE_URL}/leads/${leadId}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify(body),
                credentials: "include",
              });
              if (leadResp.ok) {
                const leadJson = await leadResp.json().catch(() => null);
                if (leadJson) {
                  setAllStudents((prev) =>
                    (prev || []).map((s) =>
                      String(s.id) === String(studentId)
                        ? {
                            ...s,
                            first_installment: body.first_installment,
                            lead: { ...(s.lead || {}), ...(leadJson || {}) },
                          }
                        : s
                    )
                  );
                }
              }
            }
          } catch (e) {
            console.debug(
              "Lead first_installment patch failed (non-blocking)",
              e
            );
          }
        }
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

  // keep a ref to avoid temporal dead zone in earlier effects
  useEffect(() => {
    handleUpdateFieldRef.current = handleUpdateField;
  }, [handleUpdateField]);

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
              disabled={exporting}
              className={`px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 ${
                exporting ? "opacity-60 cursor-not-allowed" : ""
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
                // Do not fetch immediately; the debounced filter effect will fetch once.
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
                duration: 3000,
              });
            }
            return resp;
          }}
        />
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration ?? 6000}
          onClose={() =>
            setToast({ show: false, message: "", type: "success" })
          }
        />
      )}
    </div>
  );
};

export default EnrolledStudents;
