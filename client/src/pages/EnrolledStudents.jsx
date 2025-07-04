import React, { useContext, useState, useEffect, useMemo } from "react";
import Loader from "../components/common/Loader";
import { AuthContext } from "../App";
import EnrolledStudentsTable from "../components/EnrolledStudentsTable";
import EnrolledStudentEditModal from "../components/EnrolledStudentEditModal";

const EnrolledStudents = () => {
  const { authToken } = useContext(AuthContext);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true); // Fixed: Initial state was just `true`
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // REMOVED: searchStudentName and searchEmail states
  const [searchQuery, setSearchQuery] = useState(""); // NEW: Combined search state
  const [searchLastPaymentDate, setSearchLastPaymentDate] = useState("");
  const [filterPaymentCompleted, setFilterPaymentCompleted] = useState(false);

  useEffect(() => {
    const fetchLeadsData = async () => {
      setLoading(true);
      setError(null);

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
          address: "123 Main St, Anytown",
          addressLine1: "123 Main St",
          addressLine2: "Apt 4B",
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
          totalPayment: null,
          installment1: null,
          installment2: null,
          installment3: null,
          paymentCompletedOverride: undefined,
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
          address: "456 Oak Ave, Anycity",
          addressLine1: "456 Oak Ave",
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
          totalPayment: null,
          installment1: null,
          installment2: null,
          installment3: null,
          paymentCompletedOverride: undefined,
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
          status: "Qualified", // Enrolled
          address: "789 Pine Rd, Smalltown",
          addressLine1: "789 Pine Rd",
          addressLine2: "Suite 100",
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
          courseType: "Long-term",
          previousCodingExp: "None",
          totalPayment: 2000,
          installment1: 1000,
          installment2: 500,
          installment3: 500,
          invoice: [
            {
              name: "Invoice_CB_1.pdf",
              url: "https://example.com/invoices/invoice_cb_1.pdf",
              date: "2024-05-01",
            },
            {
              name: "Invoice_CB_2.pdf",
              url: "https://example.com/invoices/invoice_cb_2.pdf",
              date: "2024-06-01",
            },
            {
              name: "Invoice_CB_3.pdf",
              url: "https://example.com/invoices/invoice_cb_3.pdf",
              date: "2024-06-15",
            },
          ],
          paymentCompletedOverride: undefined,
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
          status: "Closed", // Enrolled
          address: "101 Wonder Ln, Metropolis",
          addressLine1: "101 Wonder Ln",
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
          courseType: "Long-term",
          previousCodingExp: "Intermediate C++",
          totalPayment: 4000,
          installment1: 4000,
          installment2: null,
          installment3: null,
          invoice: [
            {
              name: "Invoice_DP_Full.pdf",
              url: "https://example.com/invoices/invoice_dp_full.pdf",
              date: "2024-05-20",
            },
            {
              name: "Receipt_DP_01.pdf",
              url: "https://example.com/invoices/receipt_dp_01.pdf",
              date: "2024-05-20",
            },
          ],
          paymentCompletedOverride: undefined,
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
          address: "500 Tech Blvd, Cyberville",
          addressLine1: "500 Tech Blvd",
          addressLine2: "Unit 20",
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
          totalPayment: null,
          installment1: null,
          installment2: null,
          installment3: null,
          paymentCompletedOverride: undefined,
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
          address: "777 Sky High, Cloud City",
          addressLine1: "777 Sky High",
          addressLine2: "Floor 12",
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
          totalPayment: null,
          installment1: null,
          installment2: null,
          installment3: null,
          paymentCompletedOverride: undefined,
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
          status: "Qualified", // Enrolled
          address: "800 Growth Way, Marketown",
          addressLine1: "800 Growth Way",
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
          courseType: "Short-term",
          previousCodingExp: "None",
          totalPayment: 1800,
          installment1: 900,
          installment2: 900,
          installment3: null,
          invoice: [
            {
              name: "Invoice_GL_1.pdf",
              url: "https://example.com/invoices/invoice_gl_1.pdf",
              date: "2024-04-10",
            },
            {
              name: "Invoice_GL_2.pdf",
              url: "https://example.com/invoices/invoice_gl_2.pdf",
              date: "2024-05-15",
            },
          ],
          paymentCompletedOverride: undefined,
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
          address: "900 Logic St, Data City",
          addressLine1: "900 Logic St",
          addressLine2: "Apt 3A",
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
          totalPayment: null,
          installment1: null,
          installment2: null,
          installment3: null,
          paymentCompletedOverride: undefined,
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
          status: "Closed", // Enrolled
          address: "10 Mobile Hts, Silicon Valley",
          addressLine1: "10 Mobile Hts",
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
          courseType: "Long-term",
          previousCodingExp: "Basic Java",
          totalPayment: 3200,
          installment1: 1500,
          installment2: 1000,
          installment3: 700,
          invoice: [
            {
              name: "Invoice_IC_1.pdf",
              url: "https://example.com/invoices/invoice_ic_1.pdf",
              date: "2024-03-01",
            },
            {
              name: "Invoice_IC_2.pdf",
              url: "https://example.com/invoices/invoice_ic_2.pdf",
              date: "2024-04-01",
            },
            {
              name: "Invoice_IC_3.pdf",
              url: "https://example.com/invoices/invoice_ic_3.pdf",
              date: "2024-05-01",
            },
          ],
          paymentCompletedOverride: undefined,
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
          address: "20 Mech Rd, Future City",
          addressLine1: "20 Mech Rd",
          addressLine2: "Unit 5",
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
          totalPayment: null,
          installment1: null,
          installment2: null,
          installment3: null,
          paymentCompletedOverride: undefined,
        },
      ];

      setAllLeads(mockLeads);
      setLoading(false);
    };

    fetchLeadsData();
  }, [authToken]);

  const isPaymentCompletedConceptually = (student) => {
    const courseValue = parseFloat(student.value?.replace("$", "")) || 0;
    const totalPaid = student.totalPayment || 0;

    if (student.paymentType === "Full") {
      return totalPaid >= courseValue;
    } else if (student.paymentType === "Installment") {
      const allInstallmentsRecorded =
        student.installment1 !== null &&
        student.installment2 !== null &&
        student.installment3 !== null;
      return totalPaid >= courseValue && allInstallmentsRecorded;
    }
    return false;
  };

  const enrolledStudents = useMemo(() => {
    let filteredStudents = allLeads.filter(
      (lead) => lead.status === "Qualified" || lead.status === "Closed"
    );

    // NEW: Combined search filter for Student Name and Email
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredStudents = filteredStudents.filter(
        (student) =>
          student.studentName.toLowerCase().includes(lowerCaseQuery) ||
          student.email.toLowerCase().includes(lowerCaseQuery)
      );
    }

    if (searchLastPaymentDate) {
      filteredStudents = filteredStudents.filter((student) => {
        if (!student.invoice || student.invoice.length === 0) {
          return false;
        }
        const latestInvoiceDate = student.invoice.reduce(
          (latestDate, invoice) => {
            if (invoice.date) {
              return latestDate && new Date(latestDate) > new Date(invoice.date)
                ? latestDate
                : invoice.date;
            }
            return latestDate;
          },
          null
        );

        return latestInvoiceDate === searchLastPaymentDate;
      });
    }

    // Filter by Payment Completed, respecting the manual override if set
    if (filterPaymentCompleted) {
      filteredStudents = filteredStudents.filter((student) => {
        if (typeof student.paymentCompletedOverride === "boolean") {
          return student.paymentCompletedOverride;
        }
        return isPaymentCompletedConceptually(student);
      });
    }

    console.log("Enrolled Students (Memoized & Filtered):", filteredStudents);
    return filteredStudents;
  }, [allLeads, searchQuery, searchLastPaymentDate, filterPaymentCompleted]); // Updated dependencies

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

  const handleUpdatePaymentStatus = (studentId, newStatusBoolean) => {
    setAllLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead._id === studentId
          ? { ...lead, paymentCompletedOverride: newStatusBoolean }
          : lead
      )
    );
    console.log(
      `Student ${studentId} payment status updated to: ${
        newStatusBoolean ? "Yes" : "No"
      }`
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

      {/* Search and Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
            >
              Last Payment Date
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
