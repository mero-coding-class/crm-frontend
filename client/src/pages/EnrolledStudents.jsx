// src/pages/EnrolledStudents.jsx

import React, { useContext, useState, useEffect, useMemo } from 'react';
import Loader from '../components/common/Loader';
import { AuthContext } from '../App';
import LeadTableDisplay from '../components/LeadTableDisplay';
import LeadEditModal from "../components/LeadEditModal";

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

      const mockLeads = [
        // ... (your existing mock data) ...
        {
          _id: '1', studentName: 'Alice Johnson', parentsName: 'Mr. & Mrs. Johnson', email: 'alice.j@example.com',
          phone: '123-456-7890', ageGrade: '10', contactWhatsapp: '123-456-7890', course: 'Full Stack Web Dev',
          source: 'Google Ads', recentCall: '2024-06-15', nextCall: '2024-06-20', status: 'New',
          address: '123 Main St, Anytown', classType: 'Online', value: '$2500',
          adsetName: 'Summer-Campaign-2024', remarks: 'Interested in evening batches.', shift: 'Evening',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'None'
        },
        {
          _id: '2', studentName: 'Bob Williams', parentsName: 'Ms. Susan Williams', email: 'bob.w@example.com',
          phone: '098-765-4321', ageGrade: '12', contactWhatsapp: '098-765-4321', course: 'Data Science',
          source: 'Facebook Ads', recentCall: '2024-06-10', nextCall: '2024-06-25', status: 'Contacted',
          address: '456 Oak Ave, Anycity', classType: 'Offline', value: '$3000',
          adsetName: 'Spring-Campaign-2024', remarks: 'Requested demo for AI modules.', shift: 'Morning',
          paymentType: 'Full', laptop: 'No', invoice: [], courseType: 'Short-term', previousCodingExp: 'Basic Python'
        },
        {
          _id: '3', studentName: 'Charlie Brown', parentsName: 'Mr. David Brown', email: 'charlie.b@example.com',
          phone: '555-123-4567', ageGrade: '11', contactWhatsapp: '555-123-4567', course: 'UI/UX Design',
          source: 'Website Form', recentCall: '2024-06-18', nextCall: 'N/A', status: 'Qualified', // This is an enrolled student
          address: '789 Pine Rd, Smalltown', classType: 'Online', value: '$2000',
          adsetName: 'Organic-Search', remarks: 'Looking for part-time course.', shift: 'Afternoon',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'None'
        },
        {
          _id: '4', studentName: 'Diana Prince', parentsName: 'Ms. Martha Prince', email: 'diana.p@example.com',
          phone: '999-888-7777', ageGrade: '9', contactWhatsapp: '999-888-7777', course: 'Game Development',
          source: 'Referral', recentCall: '2024-06-01', nextCall: '2024-07-01', status: 'Closed', // This is an enrolled student
          address: '101 Wonder Ln, Metropolis', classType: 'Offline', value: '$4000',
          adsetName: 'Referral-Program', remarks: 'Enrolled in advanced course.', shift: 'Morning',
          paymentType: 'Full', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Intermediate C++'
        },
        {
          _id: '5', studentName: 'Eve Adams', parentsName: 'Dr. Sarah Adams', email: 'eve.a@example.com',
          phone: '111-222-3333', ageGrade: '10', contactWhatsapp: '111-222-3333', course: 'Cybersecurity',
          source: 'Social Media', recentCall: '2024-06-12', nextCall: '2024-06-21', status: 'New',
          address: '500 Tech Blvd, Cyberville', classType: 'Online', value: '$2800',
          adsetName: 'Cyber-Campaign', remarks: 'Interested in ethical hacking.', shift: 'Evening',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Short-term', previousCodingExp: 'None'
        },
        {
          _id: '6', studentName: 'Frank White', parentsName: 'Mr. John White', email: 'frank.w@example.com',
          phone: '444-555-6666', ageGrade: '11', contactWhatsapp: '444-555-6666', course: 'Cloud Computing',
          source: 'Webinar', recentCall: '2024-06-05', nextCall: '2024-06-28', status: 'Contacted',
          address: '777 Sky High, Cloud City', classType: 'Online', value: '$3500',
          adsetName: 'Cloud-Masterclass', remarks: 'Needs info on AWS certifications.', shift: 'Morning',
          paymentType: 'Full', laptop: 'No', invoice: [], courseType: 'Long-term', previousCodingExp: 'Some Linux'
        },
        {
          _id: '7', studentName: 'Grace Lee', parentsName: 'Mrs. Emily Lee', email: 'grace.l@example.com',
          phone: '777-888-9999', ageGrade: '9', contactWhatsapp: '777-888-9999', course: 'Digital Marketing',
          source: 'Referral', recentCall: '2024-06-19', nextCall: 'N/A', status: 'Qualified', // This is an enrolled student
          address: '800 Growth Way, Marketown', classType: 'Offline', value: '$1800',
          adsetName: 'Referral-2024', remarks: 'Looking for a practical course.', shift: 'Afternoon',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Short-term', previousCodingExp: 'None'
        },
        {
          _id: '8', studentName: 'Henry King', parentsName: 'Mr. & Mrs. King', email: 'henry.k@example.com',
          phone: '222-333-4444', ageGrade: '13', contactWhatsapp: '222-333-4444', course: 'AI & Machine Learning',
          source: 'Ads', recentCall: '2024-06-14', nextCall: '2024-06-22', status: 'New',
          address: '900 Logic St, Data City', classType: 'Online', value: '$4500',
          adsetName: 'AI-Ignite', remarks: 'High interest in deep learning.', shift: 'Evening',
          paymentType: 'Full', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Advanced Python'
        },
        {
          _id: '9', studentName: 'Ivy Chen', parentsName: 'Mr. Wei Chen', email: 'ivy.c@example.com',
          phone: '666-777-8888', ageGrade: '10', contactWhatsapp: '666-777-8888', course: 'Mobile App Dev',
          source: 'Website Form', recentCall: '2024-06-16', nextCall: 'N/A', status: 'Closed', // This is an enrolled student
          address: '10 Mobile Hts, Silicon Valley', classType: 'Online', value: '$3200',
          adsetName: 'Dev-Summit', remarks: 'Enrolled in iOS development.', shift: 'Morning',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Basic Java'
        },
        {
          _id: '10', studentName: 'Jack Miller', parentsName: 'Ms. Laura Miller', email: 'jack.m@example.com',
          phone: '333-444-5555', ageGrade: '11', contactWhatsapp: '333-444-5555', course: 'Robotics',
          source: 'Offline Event', recentCall: '2024-06-08', nextCall: '2024-06-26', status: 'Lost',
          address: '20 Mech Rd, Future City', classType: 'Offline', value: '$5000',
          adsetName: 'Robotics-Expo', remarks: 'Decided to pursue engineering instead.', shift: 'Afternoon',
          paymentType: 'N/A', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Arduino'
        }
      ];

      setAllLeads(mockLeads);
      setLoading(false);
    };

    fetchLeadsData();
  }, [authToken]);

  const enrolledStudents = useMemo(() => {
    const filtered = allLeads.filter(
      (lead) => lead.status === 'Qualified' || lead.status === 'Closed'
    );
    console.log("Enrolled Students (Memoized):", filtered); // Add this log
    return filtered;
  }, [allLeads]);

  const handleEdit = (leadToEdit) => {
    console.log("handleEdit called with:", leadToEdit); // Add this log
    setEditingLead(leadToEdit);
    setIsModalOpen(true);
    console.log("isModalOpen set to true, editingLead set:", leadToEdit); // Add this log
  };

  const handleCloseModal = () => {
    console.log("handleCloseModal called."); // Add this log
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleSaveEdit = (updatedLead) => {
    console.log("handleSaveEdit called with:", updatedLead); // Add this log
    setAllLeads((prevLeads) =>
      prevLeads.map((lead) => (lead._id === updatedLead._id ? updatedLead : lead))
    );
    handleCloseModal();
  };

  const handleDelete = (leadId) => {
    console.log("Delete enrolled student:", leadId);
    setAllLeads(prevLeads => prevLeads.filter(lead => lead._id !== leadId));
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-100 rounded-md">Error: {error}</div>;
  }

  // Debugging: Check the state just before rendering the modal
  console.log(`EnrolledStudents: isModalOpen=${isModalOpen}, editingLead is ${editingLead ? 'set' : 'null/undefined'}`);

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Enrolled Students</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <LeadTableDisplay
          leads={enrolledStudents}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>

      {isModalOpen && editingLead && (
        <>
          {console.log("EnrolledStudents: Rendering LeadEditModal with lead:", editingLead)} {/* Add this log */}
          <LeadEditModal
            lead={editingLead}
            onClose={handleCloseModal}
            onSave={handleSaveEdit}
          />
        </>
      )}
    </div>
  );
};

export default EnrolledStudents;