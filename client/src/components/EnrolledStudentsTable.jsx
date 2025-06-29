// src/components/EnrolledStudentsTable.jsx
import React, { useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

const EnrolledStudentsTable = ({ students, handleEdit, handleDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to format dates for display or return "N/A"
  const formatDisplayDate = (dateString) => {
    if (!dateString || dateString === "N/A") {
      return "N/A";
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error(
        "Error formatting date for display:",
        error,
        "Original string:",
        dateString
      );
      return "N/A";
    }
  };

  // NEW: Function to determine the latest payment date
  const getLatestPaymentDate = (student) => {
    const dates = [];

    // Assuming installment dates are stored as properties like installment1Date, installment2Date, installment3Date
    // If your backend only provides payment amounts without dates, you'll need to adjust
    // where these dates are coming from (e.g., a separate `payments` array with `date` fields)

    if (student.installment1Date) { // Assuming a date field for 1st installment
      dates.push(new Date(student.installment1Date));
    }
    if (student.installment2Date) { // Assuming a date field for 2nd installment
      dates.push(new Date(student.installment2Date));
    }
    if (student.installment3Date) { // Assuming a date field for 3rd installment
      dates.push(new Date(student.installment3Date));
    }

    if (dates.length === 0) {
      return "N/A";
    }

    // Find the latest date among the available installment dates
    const latestDate = new Date(Math.max(...dates));
    return formatDisplayDate(latestDate);
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    const studentName = student.studentName?.toLowerCase() || "";
    const parentsName = student.parentsName?.toLowerCase() || "";
    
    // Determine the last payment date dynamically for search
    const effectiveLastPaymentDate = getLatestPaymentDate(student);
    const lowerCaseEffectiveLastPaymentDate = effectiveLastPaymentDate.toLowerCase();

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return (
      studentName.includes(lowerCaseSearchTerm) ||
      parentsName.includes(lowerCaseSearchTerm) ||
      lowerCaseEffectiveLastPaymentDate.includes(lowerCaseSearchTerm)
    );
  });

  if (!students || students.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        No enrolled students found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, parents' name, or last pay date..."
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredStudents.length === 0 ? (
        <p className="text-center text-gray-600 py-8">
          No students match your search.
        </p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parents' Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Payment
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                1st Installment
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2nd Installment
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                3rd Installment
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Pay Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map(
              (student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.studentName}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.parentsName || "N/A"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.email}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.phone}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.course}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.totalPayment ? `${student.totalPayment}` : "N/A"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.installment1 ? `${student.installment1}` : "N/A"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.installment2 ? `${student.installment2}` : "N/A"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.installment3 ? `${student.installment3}` : "N/A"}
                  </td>
                  {/* Display Last Payment Date using the new helper function */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getLatestPaymentDate(student)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.invoice && student.invoice.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {student.invoice.map((inv, index) => (
                          <a
                            key={index}
                            href={inv.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            title={inv.name || "Download Invoice"}
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            {inv.name || `Invoice ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : (
                      "No Invoice"
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EnrolledStudentsTable;