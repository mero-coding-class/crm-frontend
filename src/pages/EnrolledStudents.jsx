// src/pages/EnrolledStudents.jsx

import React, { useState, useEffect, useCallback } from "react";
import Loader from "../components/common/Loader";
import DelayedLoader from "../components/common/DelayedLoader";
import { useAuth } from "../context/AuthContext.jsx";
import EnrolledStudentsTable from "../components/EnrolledStudentsTable";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import EnrolledStudentEditModal from "../components/EnrolledStudentEditModal";
import { courseService } from "../services/courseService";
import { BASE_URL } from "../config";

// A small in-memory map to deduplicate identical outgoing requests
// (helps avoid duplicate fetches triggered by StrictMode double-invoke
// or concurrent callers). Each entry holds the Promise for the request
// and is removed when finished.
const _ongoingRequests = new Map();

// Robust safe fetch with retries, exponential backoff and timeout support.
// Returns the Fetch Response or null if all retries fail. Uses an
// internal dedupe map so multiple callers to the same URL reuse the
// same in-flight request (reduces repeated logging and backend load).
async function safeFetchWithRetries(url, opts = {}, retries = 3, backoff = 300, timeoutMs = 8000) {
  // Reuse in-flight request if present
  if (_ongoingRequests.has(url)) {
    try {
      return await _ongoingRequests.get(url);
    } catch (e) {
      // previous request failed; fall through to new attempt
    }
  }

  const controller = new AbortController();
  const mergedOpts = { ...opts, signal: controller.signal };

  const attemptFetch = async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      let timeoutHandle;
      try {
        // apply a per-attempt timeout
        const p = fetch(url, mergedOpts);
        const race = new Promise((_, rej) => {
          timeoutHandle = setTimeout(() => {
            try {
              controller.abort();
            } catch (e) {}
            rej(new Error('timeout'));
          }, timeoutMs);
        });
        const resp = await Promise.race([p, race]);
        clearTimeout(timeoutHandle);
        return resp;
      } catch (e) {
        clearTimeout(timeoutHandle);
        const isLast = attempt === retries;
        // Only warn on the final failure to avoid noisy repeated logs.
        if (isLast) {
          console.warn(`safeFetch: network error when fetching ${url} (attempt ${attempt + 1}/${retries + 1})`, e && e.message ? e.message : e);
          console.error(`safeFetch: exhausted retries for ${url}`);
        } else {
          // debug-level message for intermediate attempts (keeps console cleaner)
          if (typeof console.debug === 'function') {
            console.debug(`safeFetch: retrying ${url} (attempt ${attempt + 1}/${retries + 1})`);
          }
        }
        if (isLast) return null;
        // exponential backoff
        await new Promise((res) => setTimeout(res, backoff * Math.pow(2, attempt)));
      }
    }
    return null;
  };

  const prom = attemptFetch().finally(() => {
    // ensure we don't keep the promise around after completion
    try {
      _ongoingRequests.delete(url);
    } catch (e) {}
  });
  _ongoingRequests.set(url, prom);
  return prom;
}

const EnrolledStudents = () => {
  const { authToken } = useAuth();
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLastPaymentDate, setSearchLastPaymentDate] = useState("");
  const [filterPaymentNotCompleted, setFilterPaymentNotCompleted] =
    useState(false);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [courses, setCourses] = useState([]);

  // Server-driven pagination: fetch enrollments for a page
  const fetchEnrolledStudents = useCallback(
    async (page = 1) => {
      if (!authToken) return;
      setLoading(true);
      setError(null);
      try {
        const url = `${BASE_URL}/enrollments/?page=${page}&page_size=${ITEMS_PER_PAGE}`;
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

        setAllStudents(list || []);
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
      }
    },
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
            const idx = prev.findIndex((s) => s.id === enrollmentCandidate.id);
            if (idx === -1) return [enrollmentCandidate, ...prev];
            const next = [...prev];
            next[idx] = { ...next[idx], ...enrollmentCandidate };
            return next;
          });
          return;
        }

        // Otherwise attempt to match by email/phone if the lead became an enrolled
        // student and the backend returned student-like fields (best-effort).
        setAllStudents((prev) => {
          let changed = false;
          const next = prev.map((s) => {
            if (
              (updated.email && s.email === updated.email) ||
              (updated.phone_number && s.phone_number === updated.phone_number)
            ) {
              changed = true;
              return { ...s, ...updated };
            }
            return s;
          });
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
        setAllStudents((prev) => [enrollment, ...prev]);
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

  // Instant field update (sends PATCH to backend immediately)
  const handleUpdateField = useCallback(
    async (studentId, field, value) => {
      const paymentFields = new Set([
        "total_payment",
        "first_installment",
        "second_installment",
        "third_installment",
      ]);

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

      // Do NOT update local state until backend confirms success

      try {
        let payload = {};
        if (field === null && value && typeof value === "object") {
          payload = { ...value };
        } else {
          payload = { [backendField]: value };
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

        const response = await fetch(`${BASE_URL}/enrollments/${studentId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        if (!response.ok) {
          let errorText = await response.text();
          let errorData = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { detail: errorText };
          }
          // Show error in UI and log full response
          setError(
            `Failed to update enrollment: ${
              errorData.detail || response.statusText
            }`
          );
          console.error("PATCH error details:", {
            url: `${BASE_URL}/enrollments/${studentId}/`,
            payload,
            status: response.status,
            response: errorData,
          });
          return;
        }
        // Refetch enrollment data after successful update
        fetchEnrolledStudents(currentPage);
        setError(null);
      } catch (err) {
        setError(`Error updating student: ${err.message}`);
        console.error(`Error updating student ${field}:`, err);
      }
    },
    [authToken, fetchEnrolledStudents, currentPage]
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
        if (!resp.ok)
          throw new Error(`Failed to delete enrollment: ${resp.status}`);
        setAllStudents((prev) => prev.filter((s) => s.id !== studentId));
        // Optionally refresh current page to keep server and client in sync
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

  if (loading)
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
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <EnrolledStudentsTable
          students={allStudents}
          courses={courses}
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
          onClose={handleCloseModal}
          onSave={(updatedStudent) =>
            handleUpdateField(updatedStudent.id, null, updatedStudent)
          }
        />
      )}
    </div>
  );
};

export default EnrolledStudents;
