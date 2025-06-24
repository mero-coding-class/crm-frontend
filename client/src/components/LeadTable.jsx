import React from 'react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'; // For icons

const LeadTable = ({ leads, onEdit, onDelete, onView }) => {
  if (!leads || leads.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md text-center text-gray-500">
        <p>No leads found. Start by adding a new lead!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header-cell">Name</th>
            <th className="table-header-cell">Email</th>
            <th className="table-header-cell">Phone</th>
            <th className="table-header-cell">Company</th>
            <th className="table-header-cell">Status</th>
            <th className="table-header-cell">Source</th>
            <th className="table-header-cell">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="table-data-cell font-medium text-gray-900">{lead.name}</td>
              <td className="table-data-cell text-gray-600">{lead.email}</td>
              <td className="table-data-cell text-gray-600">{lead.phone}</td>
              <td className="table-data-cell text-gray-600">{lead.company}</td>
              <td className="table-data-cell">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${lead.status === 'New' ? 'bg-blue-100 text-blue-800' : ''}
                    ${lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800' : ''}
                    ${lead.status === 'Proposal Sent' ? 'bg-indigo-100 text-indigo-800' : ''}
                    ${lead.status === 'Converted' ? 'bg-green-100 text-green-800' : ''}
                    ${lead.status === 'Lost' ? 'bg-red-100 text-red-800' : ''}
                  `}
                >
                  {lead.status}
                </span>
              </td>
              <td className="table-data-cell text-gray-600">{lead.source}</td>
              <td className="table-data-cell text-right font-medium">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onView(lead)}
                    className="text-primary hover:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onEdit(lead)}
                    className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
                    title="Edit Lead"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(lead.id)}
                    className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
                    title="Delete Lead"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;