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

  const formatDisplayDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const handlePaymentStatusChange = (studentId, newStatus) => {
    onUpdatePaymentStatus(studentId, newStatus === "Yes");
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
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {student.student_name}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.parents_name || "N/A"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.email}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.phone_number}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.course_name}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.total_payment
                  ? `$${parseFloat(student.total_payment).toFixed(2)}`
                  : "N/A"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.first_installment
                  ? `$${parseFloat(student.first_installment).toFixed(2)}`
                  : "N/A"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.second_installment
                  ? `$${parseFloat(student.second_installment).toFixed(2)}`
                  : "N/A"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {student.third_installment
                  ? `$${parseFloat(student.third_installment).toFixed(2)}`
                  : "N/A"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatDisplayDate(student.last_pay_date)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm">
                <select
                  value={student.payment_completed ? "Yes" : "No"}
                  onChange={(e) =>
                    handlePaymentStatusChange(student.id, e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleEdit(student)}
                  className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnrolledStudentsTable;
