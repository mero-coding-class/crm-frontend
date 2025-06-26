// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Leads.jsx

import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Loader from "../components/common/Loader";
import { AuthContext } from "../App";
// If you uncomment api, ensure it's set up correctly
// import api from "../services/api";

// Import components
import LeadTableDisplay from "../components/LeadTableDisplay";
import LeadEditModal from "../components/LeadEditModal";
import AddLeadModal from "../components/AddLeadModal"; // Ensure this import path is correct

import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
// import { Link } from "react-router-dom"; // <-- IMPORTANT: Make sure this is commented out or removed if you only use buttons here.

const Leads = () => {
  const { authToken } = useContext(AuthContext);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // States for managing the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // State for managing the add lead modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitialLeads = async () => {
      setLoading(true);
      setError(null);

      // Your mock data (or replace with API call)
      const mockLeads = [
        {
          _id: "1",
          studentName: "Alice Johnson",
          parentsName: "Mr. & Mrs. Johnson",
          email: "alice.j@example.com",
          phone: "123-456-7890",
          ageGrade: "10",
          contactWhatsapp: "123-456-7890",
          course: "Full Stack Web Dev",
          source: "Google Ads",
          recentCall: "2024-06-15",
          nextCall: "2024-06-20",
          status: "New",
          address: "123 Main St",
          addressLine1: "",
          addressLine2: "",
          city: "Anytown",
          county: "Anycounty",
          postCode: "10001",
          classType: "Online",
          value: "$2500",
          adsetName: "Summer-Campaign-2024",
          remarks: "Interested in evening batches.",
          shift: "Evening",
          paymentType: "Installment",
          laptop: "Yes",
          invoice: [],
          courseType: "Long-term",
          previousCodingExp: "None",
          workshopBatch: "",
        },
        {
          _id: "2",
          studentName: "Bob Williams",
          parentsName: "Ms. Susan Williams",
          email: "bob.w@example.com",
          phone: "098-765-4321",
          ageGrade: "12",
          contactWhatsapp: "098-765-4321",
          course: "Data Science",
          source: "Facebook Ads",
          recentCall: "2024-06-10",
          nextCall: "2024-06-25",
          status: "Contacted",
          address: "456 Oak Ave",
          addressLine1: "",
          addressLine2: "",
          city: "Anycity",
          county: "Anycounty",
          postCode: "10002",
          classType: "Offline",
          value: "$3000",
          adsetName: "Spring-Campaign-2024",
          remarks: "Requested demo for AI modules.",
          shift: "Morning",
          paymentType: "Full",
          laptop: "No",
          invoice: [],
          courseType: "Short-term",
          previousCodingExp: "Basic Python",
          workshopBatch: "",
        },
        {
          _id: "3",
          studentName: "Charlie Brown",
          parentsName: "Mr. David Brown",
          email: "charlie.b@example.com",
          phone: "555-123-4567",
          ageGrade: "11",
          contactWhatsapp: "555-123-4567",
          course: "UI/UX Design",
          source: "Website Form",
          recentCall: "2024-06-18",
          nextCall: "N/A",
          status: "Qualified",
          address: "789 Pine Rd",
          addressLine1: "",
          addressLine2: "",
          city: "Smalltown",
          county: "Smallcounty",
          postCode: "10003",
          classType: "Online",
          value: "$2000",
          adsetName: "Organic-Search",
          remarks: "Looking for part-time course.",
          shift: "Afternoon",
          paymentType: "Installment",
          laptop: "Yes",
          invoice: [],
          courseType: "Long-term",
          previousCodingExp: "None",
          workshopBatch: "",
        },
        {
          _id: "4",
          studentName: "Diana Prince",
          parentsName: "Ms. Martha Prince",
          email: "diana.p@example.com",
          phone: "999-888-7777",
          ageGrade: "9",
          contactWhatsapp: "999-888-7777",
          course: "Game Development",
          source: "Referral",
          recentCall: "2024-06-01",
          nextCall: "2024-07-01",
          status: "Closed",
          address: "101 Wonder Ln",
          addressLine1: "",
          addressLine2: "",
          city: "Metropolis",
          county: "Metropcounty",
          postCode: "10004",
          classType: "Offline",
          value: "$4000",
          adsetName: "Referral-Program",
          remarks: "Enrolled in advanced course.",
          shift: "Morning",
          paymentType: "Full",
          laptop: "Yes",
          invoice: [],
          courseType: "Long-term",
          previousCodingExp: "Intermediate C++",
          workshopBatch: "",
        },
        {
          _id: "5",
          studentName: "Eve Adams",
          parentsName: "Dr. Sarah Adams",
          email: "eve.a@example.com",
          phone: "111-222-3333",
          ageGrade: "10",
          contactWhatsapp: "111-222-3333",
          course: "Cybersecurity",
          source: "Social Media",
          recentCall: "2024-06-12",
          nextCall: "2024-06-21",
          status: "New",
          address: "500 Tech Blvd",
          addressLine1: "",
          addressLine2: "",
          city: "Cyberville",
          county: "Cybercounty",
          postCode: "10005",
          classType: "Online",
          value: "$2800",
          adsetName: "Cyber-Campaign",
          remarks: "Interested in ethical hacking.",
          shift: "Evening",
          paymentType: "Installment",
          laptop: "Yes",
          invoice: [],
          courseType: "Short-term",
          previousCodingExp: "None",
          workshopBatch: "",
        },
        {
          _id: "6",
          studentName: "Frank White",
          parentsName: "Mr. John White",
          email: "frank.w@example.com",
          phone: "444-555-6666",
          ageGrade: "11",
          contactWhatsapp: "444-555-6666",
          course: "Cloud Computing",
          source: "Webinar",
          recentCall: "2024-06-05",
          nextCall: "2024-06-28",
          status: "Contacted",
          address: "777 Sky High",
          addressLine1: "",
          addressLine2: "",
          city: "Cloud City",
          county: "Cloudcounty",
          postCode: "10006",
          classType: "Online",
          value: "$3500",
          adsetName: "Cloud-Masterclass",
          remarks: "Needs info on AWS certifications.",
          shift: "Morning",
          paymentType: "Full",
          laptop: "No",
          invoice: [],
          courseType: "Long-term",
          previousCodingExp: "Some Linux",
          workshopBatch: "",
        },
        {
          _id: "7",
          studentName: "Grace Lee",
          parentsName: "Mrs. Emily Lee",
          email: "grace.l@example.com",
          phone: "777-888-9999",
          ageGrade: "9",
          contactWhatsapp: "777-888-9999",
          course: "Digital Marketing",
          source: "Referral",
          recentCall: "2024-06-19",
          nextCall: "N/A",
          status: "Qualified",
          address: "800 Growth Way",
          addressLine1: "",
          addressLine2: "",
          city: "Marketown",
          county: "Marketcounty",
          postCode: "10007",
          classType: "Offline",
          value: "$1800",
          adsetName: "Referral-2024",
          remarks: "Looking for a practical course.",
          shift: "Afternoon",
          paymentType: "Installment",
          laptop: "Yes",
          invoice: [],
          courseType: "Short-term",
          previousCodingExp: "None",
          workshopBatch: "",
        },
        {
          _id: "8",
          studentName: "Henry King",
          parentsName: "Mr. & Mrs. King",
          email: "henry.k@example.com",
          phone: "222-333-4444",
          ageGrade: "13",
          contactWhatsapp: "222-333-4444",
          course: "AI & Machine Learning",
          source: "Ads",
          recentCall: "2024-06-14",
          nextCall: "2024-06-22",
          status: "New",
          address: "900 Logic St",
          addressLine1: "",
          addressLine2: "",
          city: "Data City",
          county: "Datacounty",
          postCode: "10008",
          classType: "Online",
          value: "$4500",
          adsetName: "AI-Ignite",
          remarks: "High interest in deep learning.",
          shift: "Evening",
          paymentType: "Full",
          laptop: "Yes",
          invoice: [],
          courseType: "Long-term",
          previousCodingExp: "Advanced Python",
          workshopBatch: "",
        },
        {
          _id: "9",
          studentName: "Ivy Chen",
          parentsName: "Mr. Wei Chen",
          email: "ivy.c@example.com",
          phone: "666-777-8888",
          ageGrade: "10",
          contactWhatsapp: "666-777-8888",
          course: "Mobile App Dev",
          source: "Website Form",
          recentCall: "2024-06-16",
          nextCall: "N/A",
          status: "Closed",
          address: "10 Mobile Hts",
          addressLine1: "",
          addressLine2: "",
          city: "Silicon Valley",
          county: "Siliconcounty",
          postCode: "10009",
          classType: "Online",
          value: "$3200",
          adsetName: "Dev-Summit",
          remarks: "Enrolled in iOS development.",
          shift: "Morning",
          paymentType: "Installment",
          laptop: "Yes",
          invoice: [],
          courseType: "Long-term",
          previousCodingExp: "Basic Java",
          workshopBatch: "",
        },
        {
          _id: "10",
          studentName: "Jack Miller",
          parentsName: "Ms. Laura Miller",
          email: "jack.m@example.com",
          phone: "333-444-5555",
          ageGrade: "11",
          contactWhatsapp: "333-444-5555",
          course: "Robotics",
          source: "Offline Event",
          recentCall: "2024-06-08",
          nextCall: "2024-06-26",
          status: "Lost",
          address: "20 Mech Rd",
          addressLine1: "",
          addressLine2: "",
          city: "Future City",
          county: "Futurecounty",
          postCode: "10010",
          classType: "Offline",
          value: "$5000",
          adsetName: "Robotics-Expo",
          remarks: "Decided to pursue engineering instead.",
          shift: "Afternoon",
          paymentType: "N/A",
          laptop: "Yes",
          invoice: [],
          courseType: "Long-term",
          previousCodingExp: "Arduino",
          workshopBatch: "",
        },
      ];
      setAllLeads(mockLeads);
      setLoading(false);
    };

    fetchInitialLeads();
  }, [authToken]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      const matchesSearch =
        searchTerm === "" ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.studentName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "All" || lead.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [allLeads, searchTerm, filterStatus]);

  // Handler for opening the edit modal
  const handleEdit = (leadToEdit) => {
    console.log("Leads: handleEdit called for lead:", leadToEdit);
    setEditingLead(leadToEdit);
    setIsEditModalOpen(true); // Open the EDIT modal
  };

  // Handler for closing the edit modal
  const handleCloseEditModal = () => {
    console.log("Leads: handleCloseEditModal called.");
    setIsEditModalOpen(false);
    setEditingLead(null); // Clear the editing lead
  };

  // Handler for saving changes from the edit modal
  const handleSaveEdit = (updatedLead) => {
    console.log("Leads: handleSaveEdit called with updatedLead:", updatedLead);
    setAllLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead._id === updatedLead._id ? updatedLead : lead
      )
    );
    handleCloseEditModal();
  };

  // Handler for opening the add lead modal
  const handleOpenAddModal = () => {
    console.log("Leads: Opening Add New Lead modal.");
    setIsAddModalOpen(true);
  };

  // Handler for closing the add lead modal
  const handleCloseAddModal = () => {
    console.log("Leads: Closing Add New Lead modal.");
    setIsAddModalOpen(false);
  };

  // Handler for saving a new lead from the add modal
  const handleAddNewLead = (newLead) => {
    console.log("Leads: Adding new lead:", newLead);
    // In a real app, you'd send this to your backend and then refetch/update your state
    setAllLeads((prevLeads) => [
      ...prevLeads,
      { ...newLead, _id: `new-${Date.now()}` },
    ]); // Ensure unique ID for mock data
    handleCloseAddModal();
  };

  const handleDelete = (leadId) => {
    console.log("Leads: Delete lead:", leadId);
    setAllLeads((prevLeads) => prevLeads.filter((lead) => lead._id !== leadId));
  };

  const handleImport = () => {
    console.log("Import CSV clicked");
    // Implement your CSV import logic here
  };

  const handleExport = () => {
    console.log("Export CSV clicked");
    // Implement your CSV export logic here
  };

  const handleRefresh = useCallback(() => {
    console.log("Refreshing leads data...");
    setLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      const updatedMockLeads = [...allLeads]; // In a real app, you'd refetch from API
      setAllLeads(updatedMockLeads);
      setLoading(false);
      console.log("Leads data refreshed.");
    }, 500);
  }, [allLeads]); // Dependency on allLeads to ensure latest data is used for refresh

  const statusOptions = [
    "All",
    "New",
    "Open",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Converted",
    "Lost",
    "Junk",
  ]; // Updated status options to match AddLeadModal

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

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Leads Management</h1>

      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          {/* CORRECTED: No <Link> wrapper here */}
          <button
            onClick={handleOpenAddModal} // Only call the handler to open the modal
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
            Add New Lead
          </button>
          <button
            onClick={handleImport}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-2" />
            Import CSV
          </button>
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

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Email, Phone, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <div className="relative">
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
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <LeadTableDisplay
          leads={filteredLeads}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>

      {isEditModalOpen && editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}

      {isAddModalOpen && (
        <AddLeadModal onClose={handleCloseAddModal} onSave={handleAddNewLead} />
      )}
    </div>
  );
};

export default Leads;