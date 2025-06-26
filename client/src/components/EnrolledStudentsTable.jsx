// src/components/EnrolledStudentsTable.jsx
import React from 'react';
import { PencilIcon, TrashIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const EnrolledStudentsTable = ({ students, handleEdit, handleDelete }) => {
    if (!students || students.length === 0) {
        return <p className="text-center text-gray-600 py-8">No enrolled students found.</p>;
    }

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
                            Invoice
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
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
                                {student.invoice && student.invoice.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {student.invoice.map((inv, index) => (
                                            <a
                                                key={index}
                                                href={inv.url} // Assuming inv.url is the downloadable link
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                title={inv.name || 'Download Invoice'}
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
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EnrolledStudentsTable;