// src/pages/EnrolledStudents.jsx

import React, { useState, useEffect, useCallback } from "react";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext.jsx";
import EnrolledStudentsTable from "../components/EnrolledStudentsTable";
import EnrolledStudentEditModal from "../components/EnrolledStudentEditModal";
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

  // Fetch enrolled students
  const fetchEnrolledStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/enrollments/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const sortedData = data.sort((a, b) => b.id - a.id);
      setAllStudents(sortedData);
    } catch (err) {
      console.error("Failed to fetch enrolled students:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) fetchEnrolledStudents();
  }, [authToken, fetchEnrolledStudents]);

  // Filtered students for table
  const enrolledStudents = allStudents.filter((student) => {
    let matches = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matches =
        student.student_name.toLowerCase().includes(q) ||
        (student.email && student.email.toLowerCase().includes(q));
    }
    if (matches && searchLastPaymentDate) {
      matches = student.last_pay_date === searchLastPaymentDate;
    }
    if (matches && filterPaymentNotCompleted) {
      matches = !student.payment_completed;
    }
    return matches;
  });

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
      setAllStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s))
      );
      try {
        const payload = { [field]: value };
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

  if (loading) return <Loader />;

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
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleBulkDelete={handleBulkDelete}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onUpdateField={handleUpdateField}
        />
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
