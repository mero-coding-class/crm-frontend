import React from "react";
import {
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

const EnrolledStudentsTable = ({
  students,
  handleEdit,
  handleDelete,
  onUpdatePaymentStatus,
}) => {
  if (!students || students.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        No enrolled students found.
      </p>
    );
  }

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

  // Helper function to get the last payment date from the invoice array
  const getLastPaymentDate = (invoices) => {
    if (!invoices || invoices.length === 0) {
      return null;
    }
    let latestDate = null;
    invoices.forEach((invoice) => {
      if (invoice.date) {
        if (!latestDate || new Date(invoice.date) > new Date(latestDate)) {
          latestDate = invoice.date;
        }
      }
    });
    return latestDate;
  };

  const handlePaymentStatusChange = (studentId, newStatus) => {
    // Call the prop function passed from the parent (EnrolledStudents)
    onUpdatePaymentStatus(studentId, newStatus === "Yes"); // Pass true if 'Yes', false if 'No'
  };

  return (
    <div className="overflow-x-auto">
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
              Payment Completed
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
          {students.map((student) => {
            const completedConceptually =
              isPaymentCompletedConceptually(student);
            const lastPayDate = getLastPaymentDate(student.invoice);

            return (
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
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDisplayDate(lastPayDate)}
                </td>
                {/* Payment Completed Dropdown */}
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <select
                    value={
                      student.paymentCompletedOverride === true
                        ? "Yes"
                        : student.paymentCompletedOverride === false
                        ? "No"
                        : "No"
                    }
                    onChange={(e) =>
                      handlePaymentStatusChange(student._id, e.target.value)
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EnrolledStudentsTable;
