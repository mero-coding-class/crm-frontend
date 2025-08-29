// // src/components/LeadTableDisplay.jsx
// import React from "react";
// import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

// const LeadTableDisplay = ({ leads, handleEdit, handleDelete }) => {
//   // handleEdit prop added
//   if (leads.length === 0) {
//     return (
//       <p className="text-center text-gray-600 py-8">
//         No leads found matching your criteria.
//       </p>
//     );
//   }

//   return (
//     <div className="overflow-x-auto">
//       <table className="min-w-full divide-y divide-gray-200">
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Student Name
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Email
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Phone
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Course
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Status
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Next Call
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Next Call
//             </th>
//             <th className="relative px-3 py-3">
//               <span className="sr-only">Actions</span>
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {leads.map((lead) => (
//             <tr key={lead._id} className="hover:bg-gray-50">
//               <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                 {lead.studentName}
//               </td>
//               <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
//                 {lead.email}
//               </td>
//               <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
//                 {lead.phone}
//               </td>
//               <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
//                 {lead.course}
//               </td>
//               <td className="px-3 py-4 whitespace-nowrap text-sm">
//                 <span
//                   className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
//                   ${
//                     lead.status === "New"
//                       ? "bg-blue-100 text-blue-800"
//                       : lead.status === "Contacted"
//                       ? "bg-yellow-100 text-yellow-800"
//                       : lead.status === "Qualified"
//                       ? "bg-green-100 text-green-800"
//                       : lead.status === "Closed"
//                       ? "bg-purple-100 text-purple-800"
//                       : "bg-gray-100 text-gray-800"
//                   }`}
//                 >
//                   {lead.status}
//                 </span>
//               </td>
//               <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
//                 {lead.nextCall || "N/A"}
//               </td>
//               <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
//                 {/* Call handleEdit from props */}
//                 <button
//                   onClick={() => handleEdit(lead)}
//                   className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded-md hover:bg-indigo-50 transition-colors"
//                 >
//                   <PencilIcon className="h-5 w-5" />
//                 </button>
//                 <button
//                   onClick={() => handleDelete(lead._id)}
//                   className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
//                 >
//                   <TrashIcon className="h-5 w-5" />
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default LeadTableDisplay;
