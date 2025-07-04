// src/pages/Reports.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Loader from '../components/common/Loader';
import initialMockLeads from "../data/mockLeads";
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportDocument from '../components/ReportDocument';

// Helper function to format date for display/comparison
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Check for invalid date
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Define the columns for the Qualified Students table (now inline)
const qualifiedStudentsTableColumns = [
  { header: "Name", accessor: "studentName" },
  { header: "Parents", accessor: "parentsName" },
  { header: "Email", accessor: "email" },
  { header: "Phone", accessor: "phone" },
  { header: "WhatsApp", accessor: "contactWhatsapp" },
  { header: "Age/Grade", accessor: "ageGrade" },
  { header: "Course", accessor: "course" },
  { header: "Source", accessor: "source" },
  { header: "Add Date", accessor: "addDate" },
  { header: "Recent Call", accessor: "recentCall" },
  { header: "Next Call", accessor: "nextCall" },
  { header: "Status", accessor: "status" },
  { header: "Address", accessor: "address" },
  { header: "City", accessor: "city" },
  { header: "County", accessor: "county" },
  { header: "Post Code", accessor: "postCode" },
  { header: "Class Type", accessor: "classType" },
  { header: "Value", accessor: "value" },
  { header: "Adset Name", accessor: "adsetName" },
  { header: "Remarks", accessor: "remarks" },
  { header: "Shift", accessor: "shift" },
  { header: "Payment Type", accessor: "paymentType" },
  { header: "Device", accessor: "device" },
  { header: "Course Type", accessor: "courseType" },
  { header: "Prev Coding Exp", accessor: "previousCodingExp" },
  { header: "Workshop Batch", accessor: "workshopBatch" },
];


const Reports = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States - 'month' option removed
  const [filterType, setFilterType] = useState('none'); // 'none', 'dateRange'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State to hold the *filtered* data for the report and table
  const [filteredReportData, setFilteredReportData] = useState(null);

  useEffect(() => {
    const fetchLeadsData = async () => {
      setLoading(true);
      setError(null);
      try {
        setAllLeads(initialMockLeads);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadsData();
  }, []);

  // Function to apply filters and calculate report data
  const generateReportData = useCallback(() => {
    let leadsToProcess = allLeads;

    // Apply date range filter if selected
    if (filterType === 'dateRange' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include end date's full day

      leadsToProcess = leadsToProcess.filter(lead => {
        const addDate = new Date(lead.addDate);
        return addDate >= start && addDate <= end;
      });
    }
    // 'month' filter logic removed

    let total = 0;
    let lost = 0;
    let active = 0;
    let converted = 0;
    let missed = 0;

    const qualifiedStudents = [];

    leadsToProcess.forEach(lead => {
      total++;
      switch (lead.status) {
        case 'Lost':
          lost++;
          break;
        case 'Active':
          active++;
          break;
        case 'Qualified':
          converted++;
          qualifiedStudents.push(lead);
          break;
        case 'Closed':
          // Not counting 'Closed' as 'converted' for this report
          break;
        default:
          break;
      }
    });

    missed = total - (lost + active + converted);
    if (missed < 0) missed = 0;

    return {
      totalLeads: total,
      lostLeads: lost,
      activeLeads: active,
      convertedLeads: converted,
      missedLeads: missed,
      qualifiedStudentsList: qualifiedStudents
    };
  }, [allLeads, filterType, startDate, endDate]); // removed selectedMonth from dependencies

  // Handle "Generate Report" button click
  const handleGenerateReport = () => {
    setFilteredReportData(generateReportData());
  };

  // Initial report generation on component mount/leads load
  useEffect(() => {
    if (allLeads.length > 0 && !filteredReportData) {
      handleGenerateReport(); // Generate report initially with no filters applied
    }
  }, [allLeads, filteredReportData, handleGenerateReport]);


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

  // If filteredReportData is null (before initial generation), show loader or message
  if (!filteredReportData) {
    return <Loader />; // Or a message "Click 'Generate Report' to view data"
  }


  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">CRM Reports</h1>

      {/* Filter and Generate Report Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Filter Report Data</h2>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="none"
              checked={filterType === 'none'}
              onChange={() => setFilterType('none')}
              className="form-radio text-indigo-600"
            />
            <span className="text-gray-700">All Time</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="dateRange"
              checked={filterType === 'dateRange'}
              onChange={() => setFilterType('dateRange')}
              className="form-radio text-indigo-600"
            />
            <span className="text-gray-700">Date Range</span>
          </label>
          {/* Removed Month filter radio button */}
        </div>

        {filterType === 'dateRange' && (
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Removed Month input field */}
        {/*
        {filterType === 'month' && (
          <div className="mb-6">
            <label htmlFor="selectedMonth" className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
            <input
              type="month"
              id="selectedMonth"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 block w-full sm:w-1/2 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
        */}

        <button
          onClick={handleGenerateReport}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Generate Report
        </button>
      </div>


      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <ReportCard title="Total Leads" value={filteredReportData.totalLeads} color="bg-blue-500" />
        <ReportCard title="Active Leads" value={filteredReportData.activeLeads} color="bg-yellow-500" />
        <ReportCard title="Qualified Leads" value={filteredReportData.convertedLeads} color="bg-green-500" />
        <ReportCard title="Lost Leads" value={filteredReportData.lostLeads} color="bg-red-500" />
        <ReportCard title="Missed Leads" value={filteredReportData.missedLeads} color="bg-purple-500" />
      </div>

      {/* Download PDF Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Download Report PDF</h2>
        <PDFDownloadLink
          document={
            <ReportDocument
              reportData={filteredReportData}
              filterCriteria={{ filterType, startDate, endDate }} // Removed selectedMonth
            />
          }
          fileName={`CRM_Report_${filterType === 'dateRange' ? `${formatDate(startDate)}_to_${formatDate(endDate)}` : 'AllTime'}.pdf`} // Simplified filename
        >
          {({ blob, url, loading, error }) =>
            loading ? (
              <button className="bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed">
                Preparing PDF...
              </button>
            ) : (
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow">
                Download PDF
              </button>
            )
          }
        </PDFDownloadLink>
      </div>

      {/* Qualified Students Table (visible on web page) */}
      <h2 className="text-2xl font-bold mb-4">Qualified Students List ({
        filterType === 'dateRange' && startDate && endDate ? `From ${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Time'
      })</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {qualifiedStudentsTableColumns.map((column, index) => (
                  <th
                    key={column.accessor || index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReportData.qualifiedStudentsList.length === 0 ? (
                <tr>
                  <td colSpan={qualifiedStudentsTableColumns.length} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    No qualified students found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredReportData.qualifiedStudentsList.map((student) => (
                  <tr key={student._id}>
                    {qualifiedStudentsTableColumns.map((column, index) => (
                      <td key={column.accessor + index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student[column.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportCard = ({ title, value, color }) => (
  <div className={`${color} text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center`}>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-4xl font-bold mt-2">{value}</p>
  </div>
);

export default Reports;