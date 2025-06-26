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
import AddLeadModal from "../components/AddLeadModal";

import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const Leads = () => {
  const { authToken } = useContext(AuthContext);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for managing modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State for delete confirmation modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [leadToDeleteId, setLeadToDeleteId] = useState(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Define status options (should be a single source of truth for these)
  const statusOptions = [
    "All", // For filter dropdown
    "New",
    "Open",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Contacted",
    "Qualified",
    "Closed",
    "Converted",
    "Lost",
    "Junk",
  ];

  // Simulate fetching leads on component mount
  useEffect(() => {
    const fetchInitialLeads = async () => {
      setLoading(true);
      setError(null);

      // --- Mock Data: Replace with actual API fetch in a real app ---
      const mockLeads = [
        {
          _id: "1",
          studentName: "Alice Johnson",
          parentsName: "Mr. & Mrs. Johnson",
          email: "alice.j@example.com",
          phone: "123-456-7890",
          contactWhatsapp: "123-456-7890",
          ageGrade: "10",
          course: "Full Stack Web Dev",
          source: "Facebook",
          recentCall: "2024-06-15",
          nextCall: "2024-06-20",
          status: "New",
          address: "123 Main St",
          addressLine1: "123 Main St",
          addressLine2: "Apt 4B",
          city: "Anytown",
          county: "Anycounty",
          postCode: "10001",
          classType: "Online",
          value: "2500",
          adsetName: "Summer-Campaign-2024",
          remarks: "Interested in evening batches.",
          shift: "7 P.M. - 9 P.M.",
          paymentType: "Cash",
          laptop: "Yes",
          invoice: [],
          courseType: "Regular",
          previousCodingExp: "None",
          workshopBatch: "Summer 2024 - Batch A",
        },
        {
          _id: "2",
          studentName: "Bob Williams",
          parentsName: "Ms. Susan Williams",
          email: "bob.w@example.com",
          phone: "098-765-4321",
          contactWhatsapp: "098-765-4321",
          ageGrade: "12",
          course: "Data Science",
          source: "Website",
          recentCall: "2024-06-10",
          nextCall: "2024-06-25",
          status: "Contacted",
          address: "456 Oak Ave",
          addressLine1: "456 Oak Ave",
          addressLine2: "",
          city: "Anycity",
          county: "Anycounty",
          postCode: "10002",
          classType: "Physical",
          value: "3000",
          adsetName: "Spring-Campaign-2024",
          remarks: "Requested demo for AI modules.",
          shift: "10 A.M. - 12 P.M.",
          paymentType: "Online",
          laptop: "No",
          invoice: [],
          courseType: "Coding Kickstart",
          previousCodingExp: "Basic Python",
          workshopBatch: "Winter 2024 - Batch C",
        },
        {
          _id: "3",
          studentName: "Charlie Brown",
          parentsName: "Mr. David Brown",
          email: "charlie.b@example.com",
          phone: "555-123-4567",
          contactWhatsapp: "555-123-4567",
          ageGrade: "11",
          course: "UI/UX Design",
          source: "Email",
          recentCall: "2024-06-18",
          nextCall: "N/A",
          status: "Qualified",
          address: "789 Pine Rd",
          addressLine1: "789 Pine Rd",
          addressLine2: "Suite 100",
          city: "Smalltown",
          county: "Smallcounty",
          postCode: "10003",
          classType: "Online",
          value: "2000",
          adsetName: "Organic-Search",
          remarks: "Looking for part-time course.",
          shift: "2 P.M. - 4 P.M.",
          paymentType: "Cash",
          laptop: "Yes",
          invoice: [],
          courseType: "Regular",
          previousCodingExp: "None",
          workshopBatch: "Spring 2025 - Batch B",
        },
        {
          _id: "4",
          studentName: "Diana Prince",
          parentsName: "Ms. Martha Prince",
          email: "diana.p@example.com",
          phone: "999-888-7777",
          contactWhatsapp: "999-888-7777",
          ageGrade: "9",
          course: "Game Development",
          source: "Direct call",
          recentCall: "2024-06-01",
          nextCall: "2024-07-01",
          status: "Closed",
          address: "101 Wonder Ln",
          addressLine1: "101 Wonder Ln",
          addressLine2: "",
          city: "Metropolis",
          county: "Metropcounty",
          postCode: "10004",
          classType: "Physical",
          value: "4000",
          adsetName: "Referral-Program",
          remarks: "Enrolled in advanced course.",
          shift: "8 A.M. - 10 A.M.",
          paymentType: "Online",
          laptop: "Yes",
          invoice: [],
          courseType: "Winter coding Camp",
          previousCodingExp: "Intermediate C++",
          workshopBatch: "Fall 2024 - Batch X",
        },
        {
          _id: "5",
          studentName: "Eve Adams",
          parentsName: "Dr. Sarah Adams",
          email: "eve.a@example.com",
          phone: "111-222-3333",
          contactWhatsapp: "111-222-3333",
          ageGrade: "10",
          course: "Cybersecurity",
          source: "WhatsApp/Viber",
          recentCall: "2024-06-12",
          nextCall: "2024-06-21",
          status: "New",
          address: "500 Tech Blvd",
          addressLine1: "500 Tech Blvd",
          addressLine2: "Unit 20",
          city: "Cyberville",
          county: "Cybercounty",
          postCode: "10005",
          classType: "Online",
          value: "2800",
          adsetName: "Cyber-Campaign",
          remarks: "Interested in ethical hacking.",
          shift: "4 P.M. - 6 P.M.",
          paymentType: "Cash",
          laptop: "Yes",
          invoice: [],
          courseType: "Regular",
          previousCodingExp: "None",
          workshopBatch: "Summer 2025 - Batch D",
        },
        {
          _id: "6",
          studentName: "Frank White",
          parentsName: "Mr. John White",
          email: "frank.w@example.com",
          phone: "444-555-6666",
          contactWhatsapp: "444-555-6666",
          ageGrade: "11",
          course: "Cloud Computing",
          source: "Facebook",
          recentCall: "2024-06-05",
          nextCall: "2024-06-28",
          status: "Contacted",
          address: "777 Sky High",
          addressLine1: "777 Sky High",
          addressLine2: "Floor 12",
          city: "Cloud City",
          county: "Cloudcounty",
          postCode: "10006",
          classType: "Online",
          value: "3500",
          adsetName: "Cloud-Masterclass",
          remarks: "Needs info on AWS certifications.",
          shift: "12 P.M. - 2 P.M.",
          paymentType: "Online",
          laptop: "No",
          invoice: [],
          courseType: "Coding Kickstart",
          previousCodingExp: "Some Linux",
          workshopBatch: "Winter 2025 - Batch F",
        },
        {
          _id: "7",
          studentName: "Grace Lee",
          parentsName: "Mrs. Emily Lee",
          email: "grace.l@example.com",
          phone: "777-888-9999",
          contactWhatsapp: "777-888-9999",
          ageGrade: "9",
          course: "Digital Marketing",
          source: "Website",
          recentCall: "2024-06-19",
          nextCall: "N/A",
          status: "Qualified",
          address: "800 Growth Way",
          addressLine1: "800 Growth Way",
          addressLine2: "",
          city: "Marketown",
          county: "Marketcounty",
          postCode: "10007",
          classType: "Physical",
          value: "1800",
          adsetName: "Referral-2024",
          remarks: "Looking for a practical course.",
          shift: "2:30 P.M. - 4:30 P.M.",
          paymentType: "Cash",
          laptop: "Yes",
          invoice: [],
          courseType: "Regular",
          previousCodingExp: "None",
          workshopBatch: "Summer 2025 - Batch G",
        },
        {
          _id: "8",
          studentName: "Henry King",
          parentsName: "Mr. & Mrs. King",
          email: "henry.k@example.com",
          phone: "222-333-4444",
          contactWhatsapp: "222-333-4444",
          ageGrade: "13",
          course: "AI & Machine Learning",
          source: "Facebook",
          recentCall: "2024-06-14",
          nextCall: "2024-06-22",
          status: "New",
          address: "900 Logic St",
          addressLine1: "900 Logic St",
          addressLine2: "Apt 3A",
          city: "Data City",
          county: "Datacounty",
          postCode: "10008",
          classType: "Online",
          value: "4500",
          adsetName: "AI-Ignite",
          remarks: "High interest in deep learning.",
          shift: "5 P.M - 7 P.M.",
          paymentType: "Online",
          laptop: "Yes",
          invoice: [],
          courseType: "Winter coding Camp",
          previousCodingExp: "Advanced Python",
          workshopBatch: "Spring 2025 - Batch H",
        },
        {
          _id: "9",
          studentName: "Ivy Chen",
          parentsName: "Mr. Wei Chen",
          email: "ivy.c@example.com",
          phone: "666-777-8888",
          contactWhatsapp: "666-777-8888",
          ageGrade: "10",
          course: "Mobile App Dev",
          source: "Email",
          recentCall: "2024-06-16",
          nextCall: "N/A",
          status: "Closed",
          address: "10 Mobile Hts",
          addressLine1: "10 Mobile Hts",
          addressLine2: "",
          city: "Silicon Valley",
          county: "Siliconcounty",
          postCode: "10009",
          classType: "Online",
          value: "3200",
          adsetName: "Dev-Summit",
          remarks: "Enrolled in iOS development.",
          shift: "6 P.M. - 7 P.M.",
          paymentType: "Cash",
          laptop: "Yes",
          invoice: [],
          courseType: "Coding Kickstart",
          previousCodingExp: "Basic Java",
          workshopBatch: "Fall 2024 - Batch I",
        },
        {
          _id: "10",
          studentName: "Jack Miller",
          parentsName: "Ms. Laura Miller",
          email: "jack.m@example.com",
          phone: "333-444-5555",
          contactWhatsapp: "333-444-5555",
          ageGrade: "11",
          course: "Robotics",
          source: "WhatsApp/Viber",
          recentCall: "2024-06-08",
          nextCall: "2024-06-26",
          status: "Lost",
          address: "20 Mech Rd",
          addressLine1: "20 Mech Rd",
          addressLine2: "Unit 5",
          city: "Future City",
          county: "Futurecounty",
          postCode: "10010",
          classType: "Physical",
          value: "5000",
          adsetName: "Robotics-Expo",
          remarks: "Decided to pursue engineering instead.",
          shift: "7 P.M. - 8 P.M.",
          paymentType: "Online",
          laptop: "Yes",
          invoice: [],
          courseType: "Regular",
          previousCodingExp: "Arduino",
          workshopBatch: "Summer 2025 - Batch J",
        },
      ];
      setAllLeads(mockLeads);
      setLoading(false);
    };

    fetchInitialLeads();
  }, [authToken]); // `authToken` as a dependency if data fetch relies on it

  // --- Callback Functions ---
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const handleAddNewLead = useCallback(
    (newLeadData) => {
      // In a real app, send to backend, then update state with confirmed data
      console.log("Adding new lead:", newLeadData);
      setAllLeads((prevLeads) => [
        ...prevLeads,
        { ...newLeadData, _id: Date.now().toString() }, // Temporary ID for client-side
      ]);
      handleCloseAddModal();
    },
    [handleCloseAddModal]
  );

  const handleEdit = useCallback((lead) => {
    setEditingLead(lead);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingLead(null);
  }, []);

  const handleSaveEdit = useCallback(
    (updatedLead) => {
      // In a real app, send to backend, then update state with confirmed data
      console.log("Saving edited lead:", updatedLead);
      setAllLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        )
      );
      handleCloseEditModal();
    },
    [handleCloseEditModal]
  );

  // Function to initiate delete confirmation
  const initiateDelete = useCallback((id) => {
    setLeadToDeleteId(id);
    setShowConfirmDelete(true);
  }, []);

  // Function to confirm and perform deletion
  const confirmDelete = useCallback(() => {
    if (leadToDeleteId) {
      console.log("Deleting lead with ID:", leadToDeleteId);
      setAllLeads((prevLeads) =>
        prevLeads.filter((lead) => lead._id !== leadToDeleteId)
      );
      // In a real application, you'd send a DELETE request to your backend here
    }
    setLeadToDeleteId(null);
    setShowConfirmDelete(false);
  }, [leadToDeleteId]);

  // Function to cancel deletion
  const cancelDelete = useCallback(() => {
    setLeadToDeleteId(null);
    setShowConfirmDelete(false);
  }, []);

  // Handle status change from LeadTableDisplay's dropdown
  const handleStatusChange = useCallback(
    async (id, newStatus) => {
      // Optimistically update UI first
      setAllLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === id ? { ...lead, status: newStatus } : lead
        )
      );

      // --- IMPORTANT: Replace with actual API call to your backend ---
      try {
        /*
        const response = await fetch(`/api/leads/${id}`, { // Adjust endpoint
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          console.error(`Failed to update status for lead ${id} on backend.`);
          // Optionally, revert UI state if update fails
        } else {
          console.log(`Lead ${id} status successfully updated on backend.`);
        }
        */
        console.log(`(Simulated API) Status for ${id} changed to ${newStatus}`);
      } catch (error) {
        console.error("Error updating status:", error);
        // Optionally, revert UI state on error
      }
    },
    [] // Dependencies for useCallback: if authToken is used in fetch, add it here.
  );

  const handleImport = useCallback(() => {
    alert("Import CSV functionality not yet implemented.");
  }, []);

  const handleExport = useCallback(() => {
    alert("Export CSV functionality not yet implemented.");
  }, []);

  const handleRefresh = useCallback(() => {
    // Re-fetch initial data to simulate refresh
    setLoading(true);
    setError(null);
    // Directly re-run the initial fetch logic for mock data
    const mockLeads = [
      {
        _id: "1",
        studentName: "Alice Johnson",
        parentsName: "Mr. & Mrs. Johnson",
        email: "alice.j@example.com",
        phone: "123-456-7890",
        contactWhatsapp: "123-456-7890",
        ageGrade: "10",
        course: "Full Stack Web Dev",
        source: "Facebook",
        recentCall: "2024-06-15",
        nextCall: "2024-06-20",
        status: "New",
        address: "123 Main St",
        addressLine1: "123 Main St",
        addressLine2: "Apt 4B",
        city: "Anytown",
        county: "Anycounty",
        postCode: "10001",
        classType: "Online",
        value: "2500",
        adsetName: "Summer-Campaign-2024",
        remarks: "Interested in evening batches.",
        shift: "7 P.M. - 9 P.M.",
        paymentType: "Cash",
        laptop: "Yes",
        invoice: [],
        courseType: "Regular",
        previousCodingExp: "None",
        workshopBatch: "Summer 2024 - Batch A",
      },
      {
        _id: "2",
        studentName: "Bob Williams",
        parentsName: "Ms. Susan Williams",
        email: "bob.w@example.com",
        phone: "098-765-4321",
        contactWhatsapp: "098-765-4321",
        ageGrade: "12",
        course: "Data Science",
        source: "Website",
        recentCall: "2024-06-10",
        nextCall: "2024-06-25",
        status: "Contacted",
        address: "456 Oak Ave",
        addressLine1: "456 Oak Ave",
        addressLine2: "",
        city: "Anycity",
        county: "Anycounty",
        postCode: "10002",
        classType: "Physical",
        value: "3000",
        adsetName: "Spring-Campaign-2024",
        remarks: "Requested demo for AI modules.",
        shift: "10 A.M. - 12 P.M.",
        paymentType: "Online",
        laptop: "No",
        invoice: [],
        courseType: "Coding Kickstart",
        previousCodingExp: "Basic Python",
        workshopBatch: "Winter 2024 - Batch C",
      },
      {
        _id: "3",
        studentName: "Charlie Brown",
        parentsName: "Mr. David Brown",
        email: "charlie.b@example.com",
        phone: "555-123-4567",
        contactWhatsapp: "555-123-4567",
        ageGrade: "11",
        course: "UI/UX Design",
        source: "Email",
        recentCall: "2024-06-18",
        nextCall: "N/A",
        status: "Qualified",
        address: "789 Pine Rd",
        addressLine1: "789 Pine Rd",
        addressLine2: "Suite 100",
        city: "Smalltown",
        county: "Smallcounty",
        postCode: "10003",
        classType: "Online",
        value: "2000",
        adsetName: "Organic-Search",
        remarks: "Looking for part-time course.",
        shift: "2 P.M. - 4 P.M.",
        paymentType: "Cash",
        laptop: "Yes",
        invoice: [],
        courseType: "Regular",
        previousCodingExp: "None",
        workshopBatch: "Spring 2025 - Batch B",
      },
      {
        _id: "4",
        studentName: "Diana Prince",
        parentsName: "Ms. Martha Prince",
        email: "diana.p@example.com",
        phone: "999-888-7777",
        contactWhatsapp: "999-888-7777",
        ageGrade: "9",
        course: "Game Development",
        source: "Direct call",
        recentCall: "2024-06-01",
        nextCall: "2024-07-01",
        status: "Closed",
        address: "101 Wonder Ln",
        addressLine1: "101 Wonder Ln",
        addressLine2: "",
        city: "Metropolis",
        county: "Metropcounty",
        postCode: "10004",
        classType: "Physical",
        value: "4000",
        adsetName: "Referral-Program",
        remarks: "Enrolled in advanced course.",
        shift: "8 A.M. - 10 A.M.",
        paymentType: "Online",
        laptop: "Yes",
        invoice: [],
        courseType: "Winter coding Camp",
        previousCodingExp: "Intermediate C++",
        workshopBatch: "Fall 2024 - Batch X",
      },
      {
        _id: "5",
        studentName: "Eve Adams",
        parentsName: "Dr. Sarah Adams",
        email: "eve.a@example.com",
        phone: "111-222-3333",
        contactWhatsapp: "111-222-3333",
        ageGrade: "10",
        course: "Cybersecurity",
        source: "WhatsApp/Viber",
        recentCall: "2024-06-12",
        nextCall: "2024-06-21",
        status: "New",
        address: "500 Tech Blvd",
        addressLine1: "500 Tech Blvd",
        addressLine2: "Unit 20",
        city: "Cyberville",
        county: "Cybercounty",
        postCode: "10005",
        classType: "Online",
        value: "2800",
        adsetName: "Cyber-Campaign",
        remarks: "Interested in ethical hacking.",
        shift: "4 P.M. - 6 P.M.",
        paymentType: "Cash",
        laptop: "Yes",
        invoice: [],
        courseType: "Regular",
        previousCodingExp: "None",
        workshopBatch: "Summer 2025 - Batch D",
      },
      {
        _id: "6",
        studentName: "Frank White",
        parentsName: "Mr. John White",
        email: "frank.w@example.com",
        phone: "444-555-6666",
        contactWhatsapp: "444-555-6666",
        ageGrade: "11",
        course: "Cloud Computing",
        source: "Facebook",
        recentCall: "2024-06-05",
        nextCall: "2024-06-28",
        status: "Contacted",
        address: "777 Sky High",
        addressLine1: "777 Sky High",
        addressLine2: "Floor 12",
        city: "Cloud City",
        county: "Cloudcounty",
        postCode: "10006",
        classType: "Online",
        value: "3500",
        adsetName: "Cloud-Masterclass",
        remarks: "Needs info on AWS certifications.",
        shift: "12 P.M. - 2 P.M.",
        paymentType: "Online",
        laptop: "No",
        invoice: [],
        courseType: "Coding Kickstart",
        previousCodingExp: "Some Linux",
        workshopBatch: "Winter 2025 - Batch F",
      },
      {
        _id: "7",
        studentName: "Grace Lee",
        parentsName: "Mrs. Emily Lee",
        email: "grace.l@example.com",
        phone: "777-888-9999",
        contactWhatsapp: "777-888-9999",
        ageGrade: "9",
        course: "Digital Marketing",
        source: "Website",
        recentCall: "2024-06-19",
        nextCall: "N/A",
        status: "Qualified",
        address: "800 Growth Way",
        addressLine1: "800 Growth Way",
        addressLine2: "",
        city: "Marketown",
        county: "Marketcounty",
        postCode: "10007",
        classType: "Physical",
        value: "1800",
        adsetName: "Referral-2024",
        remarks: "Looking for a practical course.",
        shift: "2:30 P.M. - 4:30 P.M.",
        paymentType: "Cash",
        laptop: "Yes",
        invoice: [],
        courseType: "Regular",
        previousCodingExp: "None",
        workshopBatch: "Summer 2025 - Batch G",
      },
      {
        _id: "8",
        studentName: "Henry King",
        parentsName: "Mr. & Mrs. King",
        email: "henry.k@example.com",
        phone: "222-333-4444",
        contactWhatsapp: "222-333-4444",
        ageGrade: "13",
        course: "AI & Machine Learning",
        source: "Facebook",
        recentCall: "2024-06-14",
        nextCall: "2024-06-22",
        status: "New",
        address: "900 Logic St",
        addressLine1: "900 Logic St",
        addressLine2: "Apt 3A",
        city: "Data City",
        county: "Datacounty",
        postCode: "10008",
        classType: "Online",
        value: "4500",
        adsetName: "AI-Ignite",
        remarks: "High interest in deep learning.",
        shift: "5 P.M - 7 P.M.",
        paymentType: "Online",
        laptop: "Yes",
        invoice: [],
        courseType: "Winter coding Camp",
        previousCodingExp: "Advanced Python",
        workshopBatch: "Spring 2025 - Batch H",
      },
      {
        _id: "9",
        studentName: "Ivy Chen",
        parentsName: "Mr. Wei Chen",
        email: "ivy.c@example.com",
        phone: "666-777-8888",
        contactWhatsapp: "666-777-8888",
        ageGrade: "10",
        course: "Mobile App Dev",
        source: "Email",
        recentCall: "2024-06-16",
        nextCall: "N/A",
        status: "Closed",
        address: "10 Mobile Hts",
        addressLine1: "10 Mobile Hts",
        addressLine2: "",
        city: "Silicon Valley",
        county: "Siliconcounty",
        postCode: "10009",
        classType: "Online",
        value: "3200",
        adsetName: "Dev-Summit",
        remarks: "Enrolled in iOS development.",
        shift: "6 P.M. - 7 P.M.",
        paymentType: "Cash",
        laptop: "Yes",
        invoice: [],
        courseType: "Coding Kickstart",
        previousCodingExp: "Basic Java",
        workshopBatch: "Fall 2024 - Batch I",
      },
      {
        _id: "10",
        studentName: "Jack Miller",
        parentsName: "Ms. Laura Miller",
        email: "jack.m@example.com",
        phone: "333-444-5555",
        contactWhatsapp: "333-444-5555",
        ageGrade: "11",
        course: "Robotics",
        source: "WhatsApp/Viber",
        recentCall: "2024-06-08",
        nextCall: "2024-06-26",
        status: "Lost",
        address: "20 Mech Rd",
        addressLine1: "20 Mech Rd",
        addressLine2: "Unit 5",
        city: "Future City",
        county: "Futurecounty",
        postCode: "10010",
        classType: "Physical",
        value: "5000",
        adsetName: "Robotics-Expo",
        remarks: "Decided to pursue engineering instead.",
        shift: "7 P.M. - 8 P.M.",
        paymentType: "Online",
        laptop: "Yes",
        invoice: [],
        courseType: "Regular",
        previousCodingExp: "Arduino",
        workshopBatch: "Summer 2025 - Batch J",
      },
    ];
    setAllLeads(mockLeads);
    setLoading(false);
  }, [authToken]);

  // Filtering and Searching Logic (memoized for performance)
  const filteredLeads = useMemo(() => {
    let currentLeads = allLeads;

    if (searchTerm) {
      currentLeads = currentLeads.filter(
        (lead) =>
          lead.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.parentsName &&
            lead.parentsName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus && filterStatus !== "All") {
      currentLeads = currentLeads.filter(
        (lead) => lead.status === filterStatus
      );
    }

    return currentLeads;
  }, [allLeads, searchTerm, filterStatus]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">Error: {error.message}</div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
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
        {/* Pass filtered leads and the necessary handlers to LeadTableDisplay */}
        <LeadTableDisplay
          leads={filteredLeads}
          handleEdit={handleEdit}
          handleDelete={initiateDelete} // Use initiateDelete for confirmation
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Conditionally render the AddLeadModal */}
      {isAddModalOpen && (
        <AddLeadModal onClose={handleCloseAddModal} onSave={handleAddNewLead} />
      )}

      {/* Conditionally render the LeadEditModal */}
      {isEditModalOpen && editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this lead? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;