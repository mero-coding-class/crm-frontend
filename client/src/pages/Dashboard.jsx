// src/pages/Dashboard.jsx

import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../App";
import Loader from "../components/common/Loader";

// Import new dashboard components
import StatCard from "../components/dashboard/StatCard";
// We no longer need DashboardChartPlaceholder directly, as we'll use Recharts components
import LatestLeadsTable from "../components/dashboard/LatestLeadsTable";
import TopCoursesTable from "../components/dashboard/TopCoursesTable";

// Import Recharts components
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

// Import icons for stat cards and other elements
import {
  UsersIcon,
  AcademicCapIcon,
  PlusIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  ChartBarIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

// Define a custom reusable ChartContainer component for consistent styling and responsiveness
const ChartContainer = ({ title, description, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm mb-4">{description}</p>
    <div className="flex-grow min-h-[250px]"> {/* min-h for charts */}
      {children}
    </div>
  </div>
);


const Dashboard = () => {
  const { authToken } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define colors for the pie chart segments
  const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      // Removed artificial API delay for faster development feedback

      const mockDashboardData = {
        stats: {
          totalLeads: 2500,
          totalEnrolledStudents: 1200,
          newLeadsThisMonth: 150,
          revenueThisMonth: '$55,000',
          upcomingClassesCalls: 28,
        },
        charts: {
          leadStatusDistribution: [
            { name: 'New', value: 700 },
            { name: 'Contacted', value: 500 },
            { name: 'Qualified', value: 300 },
            { name: 'Closed', value: 900 },
            { name: 'Lost', value: 100 },
          ],
          enrollmentTrends: [
            { month: 'Jan', students: 100 },
            { month: 'Feb', students: 120 },
            { month: 'Mar', students: 150 },
            { month: 'Apr', students: 130 },
            { month: 'May', students: 180 },
            { month: 'Jun', students: 200 },
            { month: 'Jul', students: 210 },
            { month: 'Aug', students: 230 },
            { month: 'Sep', students: 190 },
            { month: 'Oct', students: 240 },
            { month: 'Nov', students: 260 },
            { month: 'Dec', students: 220 },
          ],
          leadsBySource: [
            { source: 'Website', leads: 450 },
            { source: 'Referral', leads: 300 },
            { source: 'Social Media', leads: 600 },
            { source: 'Ads', leads: 800 },
            { source: 'Offline Event', leads: 350 },
            { source: 'Webinar', leads: 200 },
            { source: 'Partnership', leads: 150 },
          ],
        },
        latestLeads: [
          { _id: 'l1', studentName: 'Emma Stone', email: 'emma@example.com', course: 'Data Science', status: 'New', registeredOn: '2024-06-18' },
          { _id: 'l2', studentName: 'Liam Green', email: 'liam@example.com', course: 'Full Stack', status: 'Contacted', registeredOn: '2024-06-17' },
          { _id: 'l3', studentName: 'Olivia White', email: 'olivia@example.com', course: 'UI/UX Design', status: 'Qualified', registeredOn: '2024-06-16' },
          { _id: 'l4', studentName: 'Noah Black', email: 'noah@example.com', course: 'Game Dev', status: 'New', registeredOn: '2024-06-15' },
          { _id: 'l5', studentName: 'Sophia Blue', email: 'sophia@example.com', course: 'Cybersecurity', status: 'Contacted', registeredOn: '2024-06-14' },
          { _id: 'l6', studentName: 'Jackson Red', email: 'jackson@example.com', course: 'Digital Marketing', status: 'Closed', registeredOn: '2024-06-13' },
          { _id: 'l7', studentName: 'Isabella Grey', email: 'isabella@example.com', course: 'Cloud Computing', status: 'New', registeredOn: '2024-06-12' },
          { _id: 'l8', studentName: 'Lucas Brown', email: 'lucas@example.com', course: 'Mobile App Dev', status: 'Lost', registeredOn: '2024-06-11' },
          { _id: 'l9', studentName: 'Mia Wilson', email: 'mia@example.com', course: 'Project Management', status: 'Qualified', registeredOn: '2024-06-10' },
          { _id: 'l10', studentName: 'Ethan Taylor', email: 'ethan@example.com', course: 'Financial Modeling', status: 'New', registeredOn: '2024-06-09' },
        ],
        topCourses: [
          { name: 'Full Stack Web Dev', enrollments: 350, revenue: '$1,050,000' },
          { name: 'Data Science Masterclass', enrollments: 280, revenue: '$840,000' },
          { name: 'UI/UX Design Bootcamp', enrollments: 200, revenue: '$600,000' },
          { name: 'Python for AI & ML', enrollments: 180, revenue: '$540,000' },
          { name: 'Cybersecurity Fundamentals', enrollments: 150, revenue: '$450,000' },
          { name: 'Cloud Computing with AWS', enrollments: 120, revenue: '$360,000' },
        ],
      };

      setDashboardData(mockDashboardData);
      setLoading(false);
    };

    fetchDashboardData();
  }, [authToken]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-100 rounded-md">Error: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-gray-500 p-4 text-center">Dashboard data not available.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8">Education CRM Dashboard</h1>

      {/* Top Statistical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value={dashboardData.stats.totalLeads}
          icon={UsersIcon}
          description="+10% last 30 days"
          colorClass="text-blue-600 bg-blue-100"
        />
        <StatCard
          title="Enrolled Students"
          value={dashboardData.stats.totalEnrolledStudents}
          icon={AcademicCapIcon}
          description="+5% last month"
          colorClass="text-purple-600 bg-purple-100"
        />
        <StatCard
          title="New Leads This Month"
          value={dashboardData.stats.newLeadsThisMonth}
          icon={PlusIcon}
          description="Avg. 25/week"
          colorClass="text-green-600 bg-green-100"
        />
        <StatCard
          title="Revenue This Month"
          value={dashboardData.stats.revenueThisMonth}
          icon={CurrencyDollarIcon}
          description="+$1500 last week"
          colorClass="text-teal-600 bg-teal-100"
        />
        <StatCard
          title="Upcoming Classes/Calls"
          value={dashboardData.stats.upcomingClassesCalls}
          icon={CalendarDaysIcon}
          description="Next 7 days"
          colorClass="text-orange-600 bg-orange-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Lead Status Distribution (Pie Chart) */}
        <ChartContainer
          title="Lead Status Distribution"
          description="Current breakdown of leads by their status."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.charts.leadStatusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name" // Use 'name' for the legend and tooltip
              >
                {dashboardData.charts.leadStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Enrollment Trends (Line Chart) */}
        <ChartContainer
          title="Student Enrollment Trends"
          description="Monthly trend of new student enrollments."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dashboardData.charts.enrollmentTrends}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="students" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Leads by Source (Bar Chart) */}
        <ChartContainer
          title="Leads by Source"
          description="Distribution of leads across various marketing channels."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dashboardData.charts.leadsBySource}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" angle={-15} textAnchor="end" height={50} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Latest Lead Registrations Table */}
        <LatestLeadsTable leads={dashboardData.latestLeads} />

        {/* Top Courses by Enrollment Table */}
        <TopCoursesTable courses={dashboardData.topCourses} />
      </div>

      {/* Optional: Map Placeholder for Geographic Distribution */}
      {/* You would integrate a map library here (e.g., Leaflet, Google Maps React) */}
      <ChartContainer
        title="Geographical Lead Distribution"
        description="Visualizing where your leads are coming from globally."
      >
        <div className="flex-grow flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded-md text-gray-400 text-center text-sm">
          <GlobeAltIcon className="h-10 w-10 mb-2 text-gray-300" />
          <p>Map component will go here</p>
        </div>
      </ChartContainer>
    </div>
  );
};

export default Dashboard;