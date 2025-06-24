// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Leads.jsx

import React, { useContext, useState, useEffect, useMemo } from "react";
import Loader from "../components/common/Loader";
import { AuthContext } from "../App";
// import api from "../services/api"; // Keep this import if you plan to use it later

import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";

const Leads = () => {
  const { authToken } = useContext(AuthContext);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const fetchInitialLeads = async () => {
      setLoading(true);
      setError(null);
      // REMOVED: await new Promise(resolve => setTimeout(resolve, 1500)); // Removed artificial API delay

      // Expanded Mock data reflecting whiteboard fields
      const mockLeads = [
        {
          _id: '1',
          studentName: 'Alice Johnson', parentsName: 'Mr. & Mrs. Johnson', email: 'alice.j@example.com',
          phone: '123-456-7890', ageGrade: '10', contactWhatsapp: '123-456-7890', course: 'Full Stack Web Dev',
          source: 'Google Ads', recentCall: '2024-06-15', nextCall: '2024-06-20', status: 'New',
          address: '123 Main St, Anytown', classType: 'Online', value: '$2500',
          adsetName: 'Summer-Campaign-2024', remarks: 'Interested in evening batches.', shift: 'Evening',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'None'
        },
        {
          _id: '2',
          studentName: 'Bob Williams', parentsName: 'Ms. Susan Williams', email: 'bob.w@example.com',
          phone: '098-765-4321', ageGrade: '12', contactWhatsapp: '098-765-4321', course: 'Data Science',
          source: 'Facebook Ads', recentCall: '2024-06-10', nextCall: '2024-06-25', status: 'Contacted',
          address: '456 Oak Ave, Anycity', classType: 'Offline', value: '$3000',
          adsetName: 'Spring-Campaign-2024', remarks: 'Requested demo for AI modules.', shift: 'Morning',
          paymentType: 'Full', laptop: 'No', invoice: [], courseType: 'Short-term', previousCodingExp: 'Basic Python'
        },
        {
          _id: '3',
          studentName: 'Charlie Brown', parentsName: 'Mr. David Brown', email: 'charlie.b@example.com',
          phone: '555-123-4567', ageGrade: '11', contactWhatsapp: '555-123-4567', course: 'UI/UX Design',
          source: 'Website Form', recentCall: '2024-06-18', nextCall: 'N/A', status: 'Qualified',
          address: '789 Pine Rd, Smalltown', classType: 'Online', value: '$2000',
          adsetName: 'Organic-Search', remarks: 'Looking for part-time course.', shift: 'Afternoon',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'None'
        },
        {
          _id: '4',
          studentName: 'Diana Prince', parentsName: 'Ms. Martha Prince', email: 'diana.p@example.com',
          phone: '999-888-7777', ageGrade: '9', contactWhatsapp: '999-888-7777', course: 'Game Development',
          source: 'Referral', recentCall: '2024-06-01', nextCall: '2024-07-01', status: 'Closed',
          address: '101 Wonder Ln, Metropolis', classType: 'Offline', value: '$4000',
          adsetName: 'Referral-Program', remarks: 'Enrolled in advanced course.', shift: 'Morning',
          paymentType: 'Full', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Intermediate C++'
        },
        {
          _id: '5',
          studentName: 'Eve Adams', parentsName: 'Dr. Sarah Adams', email: 'eve.a@example.com',
          phone: '111-222-3333', ageGrade: '10', contactWhatsapp: '111-222-3333', course: 'Cybersecurity',
          source: 'Social Media', recentCall: '2024-06-12', nextCall: '2024-06-21', status: 'New',
          address: '500 Tech Blvd, Cyberville', classType: 'Online', value: '$2800',
          adsetName: 'Cyber-Campaign', remarks: 'Interested in ethical hacking.', shift: 'Evening',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Short-term', previousCodingExp: 'None'
        },
        {
          _id: '6',
          studentName: 'Frank White', parentsName: 'Mr. John White', email: 'frank.w@example.com',
          phone: '444-555-6666', ageGrade: '11', contactWhatsapp: '444-555-6666', course: 'Cloud Computing',
          source: 'Webinar', recentCall: '2024-06-05', nextCall: '2024-06-28', status: 'Contacted',
          address: '777 Sky High, Cloud City', classType: 'Online', value: '$3500',
          adsetName: 'Cloud-Masterclass', remarks: 'Needs info on AWS certifications.', shift: 'Morning',
          paymentType: 'Full', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Some Linux'
        },
        {
          _id: '7',
          studentName: 'Grace Lee', parentsName: 'Mrs. Emily Lee', email: 'grace.l@example.com',
          phone: '777-888-9999', ageGrade: '9', contactWhatsapp: '777-888-9999', course: 'Digital Marketing',
          source: 'Referral', recentCall: '2024-06-19', nextCall: 'N/A', status: 'Qualified',
          address: '800 Growth Way, Marketown', classType: 'Offline', value: '$1800',
          adsetName: 'Referral-2024', remarks: 'Looking for a practical course.', shift: 'Afternoon',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Short-term', previousCodingExp: 'None'
        },
        {
          _id: '8',
          studentName: 'Henry King', parentsName: 'Mr. & Mrs. King', email: 'henry.k@example.com',
          phone: '222-333-4444', ageGrade: '13', contactWhatsapp: '222-333-4444', course: 'AI & Machine Learning',
          source: 'Ads', recentCall: '2024-06-14', nextCall: '2024-06-22', status: 'New',
          address: '900 Logic St, Data City', classType: 'Online', value: '$4500',
          adsetName: 'AI-Ignite', remarks: 'High interest in deep learning.', shift: 'Evening',
          paymentType: 'Full', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Advanced Python'
        },
        {
          _id: '9',
          studentName: 'Ivy Chen', parentsName: 'Mr. Wei Chen', email: 'ivy.c@example.com',
          phone: '666-777-8888', ageGrade: '10', contactWhatsapp: '666-777-8888', course: 'Mobile App Dev',
          source: 'Website Form', recentCall: '2024-06-16', nextCall: 'N/A', status: 'Closed',
          address: '10 Mobile Hts, Silicon Valley', classType: 'Online', value: '$3200',
          adsetName: 'Dev-Summit', remarks: 'Enrolled in iOS development.', shift: 'Morning',
          paymentType: 'Installment', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Basic Java'
        },
        {
          _id: '10',
          studentName: 'Jack Miller', parentsName: 'Ms. Laura Miller', email: 'jack.m@example.com',
          phone: '333-444-5555', ageGrade: '11', contactWhatsapp: '333-444-5555', course: 'Robotics',
          source: 'Offline Event', recentCall: '2024-06-08', nextCall: '2024-06-26', status: 'Lost',
          address: '20 Mech Rd, Future City', classType: 'Offline', value: '$5000',
          adsetName: 'Robotics-Expo', remarks: 'Decided to pursue engineering instead.', shift: 'Afternoon',
          paymentType: 'N/A', laptop: 'Yes', invoice: [], courseType: 'Long-term', previousCodingExp: 'Arduino'
        }
      ];

      setAllLeads(mockLeads);
      setLoading(false);
    };

    fetchInitialLeads();
  }, [authToken]);

  const displayedLeads = useMemo(() => {
    let filtered = allLeads;

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        lead.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
        lead.studentName.toLowerCase().includes(lowerCaseSearchTerm) ||
        lead.course.toLowerCase().includes(lowerCaseSearchTerm) ||
        lead.source.toLowerCase().includes(lowerCaseSearchTerm) ||
        lead.status.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Apply status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    return filtered;
  }, [allLeads, searchTerm, filterStatus]);

  const handleEdit = (leadId) => {
    console.log("Edit lead:", leadId);
  };

  const handleDelete = (leadId) => {
    console.log("Delete lead:", leadId);
  };

  const handleImport = () => {
    console.log("Import CSV clicked");
  };

  const handleExport = () => {
    console.log("Export CSV clicked");
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-100 rounded-md">Error: {error}</div>;
  }

  const statusOptions = ['All', 'New', 'Contacted', 'Qualified', 'Closed', 'Lost'];

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Leads Management</h1>

      {/* Action Buttons & Filters */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        {/* Main Action Buttons */}
        <div className="flex gap-3">
          <button className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center">
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
            Add New Lead
          </button>
          <button onClick={handleImport} className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center">
            <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-2" />
            Import CSV
          </button>
          <button onClick={handleExport} className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center">
            <ArrowDownTrayIcon className="h-5 w-5 inline-block mr-2" />
            Export CSV
          </button>
          <button onClick={() => window.location.reload()} className="bg-transparent text-blue-600 border border-blue-600 font-medium py-2 px-4 rounded-md hover:bg-blue-600 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center">
            <ArrowPathIcon className="h-5 w-5 inline-block mr-2" />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by Email, Phone, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {displayedLeads.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No leads found matching your criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
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
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Call
                  </th>
                  <th className="relative px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.studentName}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lead.email}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lead.phone}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lead.course}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                          lead.status === 'Closed' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'}`
                      }>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lead.nextCall || 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(lead._id)} className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded-md hover:bg-indigo-50 transition-colors">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(lead._id)} className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;