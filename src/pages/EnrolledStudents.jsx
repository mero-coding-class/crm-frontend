// src/pages/EnrolledStudents.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext.jsx";
import EnrolledStudentsTable from "../components/EnrolledStudentsTable";
import EnrolledStudentEditModal from "../components/EnrolledStudentEditModal";
import { BASE_URL } from "../config"; // Import the BASE_URL

const EnrolledStudents = () => {
  const { authToken } = useAuth();
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLastPaymentDate, setSearchLastPaymentDate] = useState("");
  const [filterPaymentCompleted, setFilterPaymentCompleted] = useState(false); // Refactored fetch function to use useCallback

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAllStudents(data);
    } catch (err) {
      console.error("Failed to fetch enrolled students:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      fetchEnrolledStudents();
    }
  }, [authToken, fetchEnrolledStudents]);

  const enrolledStudents = useMemo(() => {
    let filteredStudents = allStudents;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredStudents = filteredStudents.filter(
        (student) =>
          student.student_name.toLowerCase().includes(lowerCaseQuery) ||
          (student.email &&
            student.email.toLowerCase().includes(lowerCaseQuery))
      );
    }

    if (searchLastPaymentDate) {
      filteredStudents = filteredStudents.filter(
        (student) => student.last_pay_date === searchLastPaymentDate
      );
    }

    if (filterPaymentCompleted) {
      filteredStudents = filteredStudents.filter(
        (student) => student.payment_completed
      );
    }

    return filteredStudents;
  }, [allStudents, searchQuery, searchLastPaymentDate, filterPaymentCompleted]);

  const handleEdit = useCallback((studentToEdit) => {
    setEditingStudent(studentToEdit);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingStudent(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (updatedStudent) => {
      setLoading(true);
      try {
        const url = `${BASE_URL}/enrollments/${updatedStudent.id}/`;

        const oldStudent = allStudents.find((s) => s.id === updatedStudent.id);

        const hasNewPayment =
          (updatedStudent.first_installment &&
            updatedStudent.first_installment !==
              oldStudent.first_installment) ||
          (updatedStudent.second_installment &&
            updatedStudent.second_installment !==
              oldStudent.second_installment) ||
          (updatedStudent.third_installment &&
            updatedStudent.third_installment !== oldStudent.third_installment);

        let lastPayDate = updatedStudent.last_pay_date;
        if (hasNewPayment) {
          const today = new Date();
          lastPayDate =
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");
        }

        const payload = {
          student_name: updatedStudent.student_name,
          parents_name: updatedStudent.parents_name,
          email: updatedStudent.email,
          phone_number: updatedStudent.phone_number,
          course_name: updatedStudent.course_name,
          total_payment: updatedStudent.total_payment,
          first_installment: updatedStudent.first_installment,
          second_installment: updatedStudent.second_installment,
          third_installment: updatedStudent.third_installment,
          last_pay_date: lastPayDate,
          payment_completed: updatedStudent.payment_completed,
        };

        const response = await fetch(url, {
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
          throw new Error(
            `Failed to update student: ${
              errorData.detail || response.statusText
            }`
          );
        }

        const updatedData = await response.json();
        setAllStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === updatedData.id ? updatedData : student
          )
        );
        handleCloseModal();
      } catch (err) {
        console.error("Error saving updated student:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [allStudents, authToken, handleCloseModal]
  );

  const handleDelete = useCallback(
    async (studentId) => {
      setLoading(true);
      try {
        const url = `${BASE_URL}/enrollments/${studentId}/`;
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            Authorization: `Token ${authToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete student: ${response.statusText}`);
        }

        setAllStudents((prevStudents) =>
          prevStudents.filter((student) => student.id !== studentId)
        );
      } catch (err) {
        console.error("Error deleting student:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  ); // ADD THIS FUNCTION FOR BULK DELETE
  const handleBulkDelete = useCallback(
    async (studentIds) => {
      setLoading(true);
      setError(null);
      try {
        // Create an array of delete promises
        const deletePromises = studentIds.map((id) =>
          fetch(`${BASE_URL}/enrollments/${id}/`, {
            method: "DELETE",
            headers: {
              Authorization: `Token ${authToken}`,
            },
            credentials: "include",
          })
        ); // Wait for all delete requests to complete

        const responses = await Promise.all(deletePromises);
        const failedDeletes = responses.filter((response) => !response.ok);

        if (failedDeletes.length > 0) {
          throw new Error(
            `Failed to delete ${failedDeletes.length} student(s).`
          );
        } // Update the state to reflect the successful deletions

        setAllStudents((prevStudents) =>
          prevStudents.filter((student) => !studentIds.includes(student.id))
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

  const handleUpdatePaymentStatus = useCallback(
    async (studentId, newStatusBoolean) => {
      setLoading(true);
      try {
        const url = `${BASE_URL}/enrollments/${studentId}/`;
        const payload = {
          payment_completed: newStatusBoolean,
        };

        const response = await fetch(url, {
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
          throw new Error(
            `Failed to update payment status: ${
              errorData.detail || response.statusText
            }`
          );
        }

        const updatedData = await response.json();
        setAllStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === updatedData.id ? updatedData : student
          )
        );
        console.log(
          `Student ${studentId} payment status updated to: ${
            newStatusBoolean ? "Yes" : "No"
          }`
        );
      } catch (err) {
        console.error("Error updating payment status:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded-md">
        Error: {error}{" "}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
     <h1 className="text-3xl font-bold mb-6">Enrolled Students</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
       {" "}
        <h2 className="text-xl font-semibold mb-4">
          Filter Enrolled Students: 
        </h2>
     
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
          <div>
          
            <label
              htmlFor="searchQuery"
              className="block text-sm font-medium text-gray-700"
            >
             Student Name or Email 
            </label>
            
            <input
              type="text"
              id="searchQuery"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
            />
         
          </div>
        
          <div>
            
            <label
              htmlFor="searchLastPaymentDate"
              className="block text-sm font-medium text-gray-700"
            > Last Payment Date 
            </label>
          
            <input
              type="date"
              id="searchLastPaymentDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              value={searchLastPaymentDate}
              onChange={(e) => setSearchLastPaymentDate(e.target.value)}
            />
            
          </div>
          
          <div className="flex items-center mt-6">
         
            <input
              type="checkbox"
              id="filterPaymentCompleted"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={filterPaymentCompleted}
              onChange={(e) => setFilterPaymentCompleted(e.target.checked)}
            />
         
            <label
              htmlFor="filterPaymentCompleted"
              className="ml-2 block text-sm font-medium text-gray-700"
            >
               Payment Completed 
            </label>
          
          </div>
         
        </div>
        
      </div>
    
      <div className="bg-white p-6 rounded-lg shadow-md">
      
        <EnrolledStudentsTable
          students={enrolledStudents}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          // ADD THE handleBulkDelete PROP HERE
          handleBulkDelete={handleBulkDelete}
        />
        
      </div>
    
      {isModalOpen && editingStudent && (
        <EnrolledStudentEditModal
          student={editingStudent}
          onClose={handleCloseModal}
          onSave={handleSaveEdit}
        />
      )}
         {" "}
    </div>
  );
};

export default EnrolledStudents;
