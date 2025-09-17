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
  const [courses, setCourses] = useState([]);

  // Fetch enrolled students
  const fetchEnrolledStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const baseUrl = `${BASE_URL}/enrollments/`;
    // safeFetch wraps fetch to return null on network failure so background
    // pagination doesn't throw uncaught TypeErrors.
    const safeFetch = async (url, opts = {}) => {
      try {
        return await fetch(url, opts);
      } catch (e) {
        console.warn(
          "safeFetch: network error when fetching",
          url,
          e && e.message ? e.message : e
        );
        return null;
      }
    };
    try {
      const pageUrl = `${baseUrl}?page=1&page_size=${ITEMS_PER_PAGE}`;
      const resp = await safeFetch(pageUrl, {
        headers: { Authorization: `Token ${authToken}` },
        credentials: "include",
      });

      if (resp && resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json.results)) {
          setAllStudents(json.results);
          (async () => {
            try {
              if (json.next) {
                let accumulated = [...json.results];
                let nextUrl = json.next;
                const MAX_ACCUMULATE = 2000;
                while (nextUrl) {
                  const r = await safeFetch(nextUrl, {
                    headers: { Authorization: `Token ${authToken}` },
                    credentials: "include",
                  });
                  if (!r || !r.ok) break;
                  const j = await r.json();
                  accumulated = accumulated.concat(j.results || []);
                  if (accumulated.length >= MAX_ACCUMULATE) {
                    console.warn(
                      "Enrollments background fetch reached cap, stopping further fetch to avoid UI freeze"
                    );
                    break;
                  }
                  nextUrl = j.next;
                }
                setAllStudents(
                  (accumulated || []).slice(0, MAX_ACCUMULATE).sort((a, b) => {
                    const ta = a.created_at || a.updated_at || null;
                    const tb = b.created_at || b.updated_at || null;
                    if (ta && tb) return new Date(tb) - new Date(ta);
                    if (a.id !== undefined && b.id !== undefined)
                      return Number(b.id) - Number(a.id);
                    return 0;
                  })
                );
              } else {
                const full = await safeFetch(baseUrl, {
                  headers: { Authorization: `Token ${authToken}` },
                  credentials: "include",
                });
                if (full && full.ok) {
                  const all = await full.json();
                  setAllStudents(Array.isArray(all) ? all : all.results || []);
                } else {
                  console.warn(
                    "Background full enrollments fetch failed or returned no response"
                  );
                }
              }
            } catch (e) {
              console.warn(
                "Background enrollments fetch failed",
                e && e.message ? e.message : e
              );
            }
          })();
          return;
        }

        if (Array.isArray(json)) {
          setAllStudents(
            (json.slice(0, ITEMS_PER_PAGE) || []).sort((a, b) => {
              const ta = a.created_at || a.updated_at || null;
              const tb = b.created_at || b.updated_at || null;
              if (ta && tb) return new Date(tb) - new Date(ta);
              if (a.id !== undefined && b.id !== undefined)
                return Number(b.id) - Number(a.id);
              return 0;
            })
          );
          (async () => {
            try {
              const full = await safeFetch(baseUrl, {
                headers: { Authorization: `Token ${authToken}` },
                credentials: "include",
              });
              if (full && full.ok) {
                const all = await full.json();
                setAllStudents(
                  ((Array.isArray(all) ? all : all.results || []) || []).sort(
                    (a, b) => {
                      const ta = a.created_at || a.updated_at || null;
                      const tb = b.created_at || b.updated_at || null;
                      if (ta && tb) return new Date(tb) - new Date(ta);
                      if (a.id !== undefined && b.id !== undefined)
                        return Number(b.id) - Number(a.id);
                      return 0;
                    }
                  )
                );
              } else {
                console.warn(
                  "Background enrollments full fetch failed or returned no response"
                );
              }
            } catch (e) {
              console.warn(
                "Background enrollments full fetch failed",
                e && e.message ? e.message : e
              );
            }
          })();
          return;
        }
      }
      const fallback = await safeFetch(baseUrl, {
        headers: { Authorization: `Token ${authToken}` },
        credentials: "include",
      });
      if (fallback && fallback.ok) {
        const data = await fallback.json();
        setAllStudents(
          ((Array.isArray(data) ? data : data.results || []) || []).sort(
            (a, b) => {
              const ta = a.created_at || a.updated_at || null;
              const tb = b.created_at || b.updated_at || null;
              if (ta && tb) return new Date(tb) - new Date(ta);
              if (a.id !== undefined && b.id !== undefined)
                return Number(b.id) - Number(a.id);
              return 0;
            }
          )
        );
      } else {
        throw new Error(
          `Failed to fetch enrollments: no response or ${
            fallback && fallback.status
          }`
        );
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load enrolled students");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) fetchEnrolledStudents();

    const importDebounce = { timeoutId: null };
    const onImported = (e) => {
      console.info(
        "EnrolledStudents: detected crm:imported event — scheduling refresh"
      );
      if (importDebounce.timeoutId) clearTimeout(importDebounce.timeoutId);
      importDebounce.timeoutId = setTimeout(() => {
        fetchEnrolledStudents();
        importDebounce.timeoutId = null;
      }, 700);
    };
    window.addEventListener("crm:imported", onImported);

    return () => {
      window.removeEventListener("crm:imported", onImported);
      if (importDebounce.timeoutId) clearTimeout(importDebounce.timeoutId);
    };
  }, [authToken, fetchEnrolledStudents]);

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
    const fetchCourses = async () => {
      if (!authToken) return;
      try {
        const data = await courseService.getCourses(authToken);
        if (!cancelled) setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // When the courses list is available, enrich any students that are missing
  // an explicit course_name by resolving student.course (id or object).
  useEffect(() => {
    if (!courses || courses.length === 0 || allStudents.length === 0) return;
    setAllStudents((prev) =>
      prev.map((s) => {
        if (s.course_name) return s;
        const c = s.course;
        let resolved = "";
        if (c && typeof c === "object") {
          resolved = c.course_name || c.name || "";
        } else if (c !== undefined && c !== null) {
          const found = courses.find((co) => String(co.id) === String(c));
          if (found) resolved = found.course_name || found.name || "";
        }
        if (resolved) return { ...s, course_name: resolved };
        return s;
      })
    );
  }, [courses, allStudents.length]);

  // Filtered students for table
  const filteredStudents = allStudents.filter((student) => {
    let matches = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (student.student_name || "").toLowerCase();
      const email = (student.email || "").toLowerCase();
      matches = name.includes(q) || (email && email.includes(q));
    }
    if (matches && searchLastPaymentDate) {
      matches = student.last_pay_date === searchLastPaymentDate;
    }
    if (matches && filterPaymentNotCompleted) {
      matches = !student.payment_completed;
    }
    return matches;
  });

  // compute pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  );
  // Ensure current page is valid when filteredStudents changes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredStudents.length, totalPages]);

  // students to display on current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const enrolledStudents = filteredStudents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Modal handlers
  const handleEdit = useCallback((student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingStudent(null);
  }, []);

  // Delete handlers
  const handleDelete = useCallback(
    async (studentId) => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/enrollments/${studentId}/`, {
          method: "DELETE",
          headers: { Authorization: `Token ${authToken}` },
          credentials: "include",
        });
        if (!response.ok)
          throw new Error(`Failed to delete student: ${response.statusText}`);
        setAllStudents((prev) => prev.filter((s) => s.id !== studentId));
      } catch (err) {
        console.error("Error deleting student:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

  const handleBulkDelete = useCallback(
    async (studentIds) => {
      setLoading(true);
      setError(null);
      try {
        const deletePromises = studentIds.map((id) =>
          fetch(`${BASE_URL}/enrollments/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Token ${authToken}` },
            credentials: "include",
          })
        );
        const responses = await Promise.all(deletePromises);
        const failedDeletes = responses.filter((r) => !r.ok);
        if (failedDeletes.length > 0)
          throw new Error(
            `Failed to delete ${failedDeletes.length} student(s).`
          );
        setAllStudents((prev) =>
          prev.filter((s) => !studentIds.includes(s.id))
        );
      } catch (err) {
        console.error("Error during bulk delete:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

  // Instant field update (sends PATCH to backend immediately)
  const handleUpdateField = useCallback(
    async (studentId, field, value) => {
      // If caller passed a full object (modal save), apply full merge
      const paymentFields = new Set([
        "total_payment",
        "first_installment",
        "second_installment",
        "third_installment",
      ]);

      // Update local optimistic state
      if (field === null && value && typeof value === "object") {
        setAllStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, ...value } : s))
        );
      } else {
        setAllStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s))
        );
      }

      try {
        let payload = {};

        if (field === null && value && typeof value === "object") {
          // full object update from modal
          payload = { ...value };
        } else {
          payload = { [field]: value };
        }

        // If a payment-related field changed or payment_completed is set to true,
        // update last_pay_date to today (in YYYY-MM-DD) so the table reflects recent payment
        const todayDate = new Date().toISOString().split("T")[0];
        const paymentChanged =
          field === "payment_completed" ||
          paymentFields.has(field) ||
          (field === null &&
            value &&
            (paymentFields.has("total_payment") ||
              paymentFields.has("first_installment")));

        if (paymentChanged) {
          // If payment_completed explicitly true or any installment/total provided, set last_pay_date
          if (
            payload.payment_completed === true ||
            paymentFields.has(field) ||
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
          const errorData = await response.json();
          throw new Error(errorData.detail || response.statusText);
        }
      } catch (err) {
        console.error(`Error updating student ${field}:`, err);
        setError(err.message);
      }
    },
    [authToken]
  );

  // Payment status update
  const handleUpdatePaymentStatus = useCallback(
    async (studentId, newStatus) => {
      handleUpdateField(studentId, "payment_completed", newStatus);
    },
    [handleUpdateField]
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
          students={enrolledStudents}
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
