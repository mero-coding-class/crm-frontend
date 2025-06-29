// src/pages/EnrolledStudents.jsx

import React, { useContext, useState, useEffect, useMemo } from 'react';
import Loader from '../components/common/Loader';
import { AuthContext } from '../App';
import EnrolledStudentsTable from "../components/EnrolledStudentsTable";
import EnrolledStudentEditModal from "../components/EnrolledStudentEditModal";

// Assuming your updated mockLeads are in a separate file, e.g., src/data/mockLeads.js
// If your mockLeads are still inline within this file, you can ignore this import.
import initialMockLeads from "../data/mockLeads"; // Adjusted import name for clarity

const EnrolledStudents = () => {
  const { authToken } = useContext(AuthContext);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  useEffect(() => {
    const fetchLeadsData = async () => {
      setLoading(true);
      setError(null);

      // Use the imported mock leads data
      setAllLeads(initialMockLeads); // Now using the imported data
      setLoading(false);
    };

    fetchLeadsData();
  }, [authToken]);

  const enrolledStudents = useMemo(() => {
    const filtered = allLeads.filter(
      // Enrolled students are those with 'Qualified' or 'Closed' status
      (lead) => lead.status === "Qualified" || lead.status === "Closed"
    );
    console.log("Enrolled Students (Memoized):", filtered);
    return filtered;
  }, [allLeads]);

  const handleEdit = (studentToEdit) => {
    console.log("handleEdit called with:", studentToEdit);
    setEditingLead(studentToEdit);
    setIsModalOpen(true);
    console.log("isModalOpen set to true, editingLead set:", studentToEdit);
  };

  const handleCloseModal = () => {
    console.log("handleCloseModal called.");
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleSaveEdit = (updatedStudent) => {
    console.log("handleSaveEdit called with:", updatedStudent);
    // In a real application, you'd send this updatedStudent to your backend.
    // The backend would then handle updating payment dates based on new payments.
    setAllLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead._id === updatedStudent._id ? updatedStudent : lead
      )
    );
    handleCloseModal();
  };

  const handleDelete = (studentId) => {
    console.log("Delete enrolled student:", studentId);
    setAllLeads((prevLeads) =>
      prevLeads.filter((lead) => lead._id !== studentId)
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded-md">
        Error: {error}
      </div>
    );
  }

  console.log(
    `EnrolledStudents: isModalOpen=${isModalOpen}, editingLead is ${
      editingLead ? "set" : "null/undefined"
    }`
  );

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Enrolled Students</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <EnrolledStudentsTable
          students={enrolledStudents}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>

      {isModalOpen && editingLead && (
        <>
          {console.log(
            "EnrolledStudents: Rendering EnrolledStudentEditModal with student:",
            editingLead
          )}{" "}
          <EnrolledStudentEditModal
            student={editingLead}
            onClose={handleCloseModal}
            onSave={handleSaveEdit}
          />
        </>
      )}
    </div>
  );
};

export default EnrolledStudents;