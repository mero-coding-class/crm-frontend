// import React, { useState, useEffect, useCallback } from "react";
// import LeadTableDisplay from "./LeadTableDisplay";
// import ImportCsvButton from "./ImportCsvButton";
// import LeadFormModal from "./LeadFormModal";

// const PAGE_SIZE = 20;

// const LeadPage = ({ authToken, changeLogService }) => {
//   const [leads, setLeads] = useState([]);
//   const [totalLeads, setTotalLeads] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);

//   /* ------------------------- FETCH LEADS ------------------------- */
//   const fetchLeads = useCallback(
//     async (page = 1) => {
//       setLoading(true);
//       try {
//         const res = await fetch(
//           `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/?page=${page}&page_size=${PAGE_SIZE}`,
//           {
//             headers: {
//               Authorization: `Token ${authToken}`,
//             },
//           }
//         );
//         if (!res.ok) throw new Error("Failed to fetch leads");
//         const data = await res.json();

//         setLeads(data.results || []);
//         setTotalLeads(data.count || 0);
//         setCurrentPage(page);
//       } catch (err) {
//         console.error("Error fetching leads:", err);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [authToken]
//   );

//   useEffect(() => {
//     fetchLeads(1); // always load page 1 initially
//   }, [fetchLeads]);

//   /* --------------------- ADD / IMPORT --------------------- */
//   const handleAddLead = (newLead) => {
//     // Put new lead on top
//     setLeads((prev) => [newLead, ...prev.slice(0, PAGE_SIZE - 1)]);
//     setTotalLeads((prev) => prev + 1);
//     setCurrentPage(1); // stay on page 1
//   };

//   const handleImported = (importedLeads) => {
//     // Add imported leads on top (only first PAGE_SIZE shown)
//     setLeads((prev) => [...importedLeads, ...prev].slice(0, PAGE_SIZE));
//     setTotalLeads((prev) => prev + importedLeads.length);
//     setCurrentPage(1); // stay on page 1
//   };

//   /* --------------------- EDIT / DELETE --------------------- */
//   const handleEdit = (updatedLead) => {
//     setLeads((prev) =>
//       prev.map((lead) => (lead._id === updatedLead._id ? updatedLead : lead))
//     );
//   };

//   const handleDelete = (leadId) => {
//     setLeads((prev) => prev.filter((lead) => lead._id !== leadId));
//     setTotalLeads((prev) => prev - 1);
//   };

//   const handleBulkDelete = (ids) => {
//     setLeads((prev) => prev.filter((lead) => !ids.includes(lead._id)));
//     setTotalLeads((prev) => prev - ids.length);
//   };

//   /* --------------------- PAGINATION --------------------- */
//   const handlePageChange = (page) => {
//     fetchLeads(page);
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-xl font-semibold">Leads</h1>
//         <div className="flex gap-4">
//           <ImportCsvButton
//             authToken={authToken}
//             courses={[]}
//             onImported={handleImported}
//             onOptimisticAdd={handleAddLead}
//           />
//           <LeadFormModal onSave={handleAddLead} authToken={authToken} />
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-gray-600">Loading leads...</p>
//       ) : (
//         <LeadTableDisplay
//           leads={leads}
//           handleEdit={handleEdit}
//           handleDelete={handleDelete}
//           handleBulkDelete={handleBulkDelete}
//           authToken={authToken}
//           changeLogService={changeLogService}
//           currentPage={currentPage}
//           totalPages={Math.ceil(totalLeads / PAGE_SIZE)}
//           onPageChange={handlePageChange}
//         />
//       )}
//     </div>
//   );
// };

// export default LeadPage;
