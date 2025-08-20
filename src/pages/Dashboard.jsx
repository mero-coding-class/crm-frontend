// src/pages/Dashboard.jsx

import React, { useContext, useState, useEffect, useMemo } from "react";
import { AuthContext } from "../App";
import Loader from "../components/common/Loader";

// Import your mock leads data
import initialMockLeads from "../data/mockLeads"; // <--- NEW IMPORT

// Import new dashboard components
import StatCard from "../components/dashboard/StatCard";
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
} from "recharts";

// Import icons for stat cards and other elements
import {
  UsersIcon,
  AcademicCapIcon,
  PlusIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

// Define a custom reusable ChartContainer component for consistent styling and responsiveness
const ChartContainer = ({ title, description, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm mb-4">{description}</p>
    <div className="flex-grow min-h-[250px]">
      {" "}
      {/* min-h for charts */}
      {children}
    </div>
  </div>
);

const Dashboard = () => {
  const { authToken } = useContext(AuthContext);
  const [allLeads, setAllLeads] = useState([]); // State to hold all leads from mock data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define colors for the pie chart segments
  const PIE_COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
  ];

  useEffect(() => {
    const fetchLeadsData = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real application, you'd fetch data from an API here:
        // const response = await fetch('/api/all-leads', {
        //   headers: { Authorization: `Bearer ${authToken}` }
        // });
        // if (!response.ok) throw new Error('Failed to fetch leads');
        // const data = await response.json();
        // setAllLeads(data);

        // For now, using mock leads data:
        setAllLeads(initialMockLeads);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadsData();
  }, [authToken]); // Dependency on authToken to refetch if auth changes

  // --- Dynamic Dashboard Data Calculation ---
  const dashboardData = useMemo(() => {
    if (allLeads.length === 0) {
      return null; // Return null if no leads yet
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // --- Stats Calculation ---
    const totalLeads = allLeads.length;
    const enrolledLeads = allLeads.filter(
      (lead) => lead.status === "Qualified" || lead.status === "Closed"
    );
    const totalEnrolledStudents = enrolledLeads.length;

    const newLeadsThisMonth = allLeads.filter((lead) => {
      const addDate = new Date(lead.addDate);
      return (
        addDate.getMonth() === currentMonth &&
        addDate.getFullYear() === currentYear
      );
    }).length;

    let revenueThisMonth = 0;
    enrolledLeads.forEach((lead) => {
      // Sum up installment payments if their dates fall within the current month
      if (lead.installment1Date) {
        const date1 = new Date(lead.installment1Date);
        if (
          date1.getMonth() === currentMonth &&
          date1.getFullYear() === currentYear
        ) {
          revenueThisMonth += lead.installment1 || 0;
        }
      }
      if (lead.installment2Date) {
        const date2 = new Date(lead.installment2Date);
        if (
          date2.getMonth() === currentMonth &&
          date2.getFullYear() === currentYear
        ) {
          revenueThisMonth += lead.installment2 || 0;
        }
      }
      if (lead.installment3Date) {
        const date3 = new Date(lead.installment3Date);
        if (
          date3.getMonth() === currentMonth &&
          date3.getFullYear() === currentYear
        ) {
          revenueThisMonth += lead.installment3 || 0;
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999); // End of 7th day

    const upcomingClassesCalls = allLeads.filter((lead) => {
      if (!lead.nextCall || lead.nextCall === "N/A") return false;
      const nextCallDate = new Date(lead.nextCall);
      return nextCallDate >= today && nextCallDate <= sevenDaysFromNow;
    }).length;

    // --- Charts Data Calculation ---
    const leadStatusDistributionMap = new Map();
    allLeads.forEach((lead) => {
      const status = lead.status || "Unknown";
      leadStatusDistributionMap.set(
        status,
        (leadStatusDistributionMap.get(status) || 0) + 1
      );
    });
    const leadStatusDistribution = Array.from(
      leadStatusDistributionMap.entries()
    ).map(([name, value]) => ({ name, value }));

    const enrollmentTrendsMap = new Map(); // Key: YYYY-MM, Value: count
    enrolledLeads.forEach((lead) => {
      const addDate = new Date(lead.addDate);
      const monthYear = `${addDate.getFullYear()}-${String(
        addDate.getMonth() + 1
      ).padStart(2, "0")}`;
      enrollmentTrendsMap.set(
        monthYear,
        (enrollmentTrendsMap.get(monthYear) || 0) + 1
      );
    });
    // Sort months chronologically and format for chart
    const enrollmentTrends = Array.from(enrollmentTrendsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthYear, students]) => ({
        month: monthYear.substring(5),
        students,
      })); // Use MM for month

    const leadsBySourceMap = new Map();
    allLeads.forEach((lead) => {
      const source = lead.source || "Unknown";
      leadsBySourceMap.set(source, (leadsBySourceMap.get(source) || 0) + 1);
    });
    const leadsBySource = Array.from(leadsBySourceMap.entries()).map(
      ([source, leads]) => ({ source, leads })
    );

    // --- Tables Data Calculation ---
    const latestLeads = [...allLeads] // Create a copy to sort
      .sort((a, b) => new Date(b.addDate) - new Date(a.addDate))
      .slice(0, 10) // Get top 10 latest leads
      .map((lead) => ({
        _id: lead._id,
        studentName: lead.studentName,
        email: lead.email,
        course: lead.course,
        status: lead.status,
        registeredOn: lead.addDate, // Using addDate as registeredOn
      }));

    const topCoursesMap = new Map(); // Key: courseName, Value: { enrollments: count, revenue: sum }
    enrolledLeads.forEach((lead) => {
      const courseName = lead.course || "Unknown Course";
      const currentData = topCoursesMap.get(courseName) || {
        enrollments: 0,
        revenue: 0,
      };
      topCoursesMap.set(courseName, {
        enrollments: currentData.enrollments + 1,
        revenue: currentData.revenue + (lead.totalPayment || 0),
      });
    });
    const topCourses = Array.from(topCoursesMap.entries())
      .map(([name, data]) => ({
        name,
        enrollments: data.enrollments,
        revenue: `${data.revenue.toLocaleString()}`, // Format revenue
      }))
      .sort((a, b) => b.enrollments - a.enrollments) // Sort by enrollments descending
      .slice(0, 7); // Get top 7 courses

    return {
      stats: {
        totalLeads,
        totalEnrolledStudents,
        newLeadsThisMonth,
        revenueThisMonth: `$${revenueThisMonth.toLocaleString()}`, // Format revenue
        upcomingClassesCalls,
      },
      charts: {
        leadStatusDistribution,
        enrollmentTrends,
        leadsBySource,
      },
      latestLeads,
      topCourses,
    };
  }, [allLeads]); // Recalculate whenever allLeads changes

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

  if (!dashboardData) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No dashboard data available. Please add some leads.
      </div>
    );
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
          description="Overall count of all leads"
          colorClass="text-blue-600 bg-blue-100"
        />
        <StatCard
          title="Enrolled Students"
          value={dashboardData.stats.totalEnrolledStudents}
          icon={AcademicCapIcon}
          description="Qualified or Closed leads"
          colorClass="text-purple-600 bg-purple-100"
        />
        <StatCard
          title="New Leads This Month"
          value={dashboardData.stats.newLeadsThisMonth}
          icon={PlusIcon}
          description="Leads added in current month"
          colorClass="text-green-600 bg-green-100"
        />
        <StatCard
          title="Revenue This Month"
          value={dashboardData.stats.revenueThisMonth}
          icon={CurrencyDollarIcon}
          description="Payments received in current month"
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
                nameKey="name"
              >
                {dashboardData.charts.leadStatusDistribution.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  )
                )}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Enrollment Trends (Line Chart) */}
        <ChartContainer
          title="Student Enrollment Trends"
          description="Monthly trend of new student enrollments (based on add date)."
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
              <Line
                type="monotone"
                dataKey="students"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
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
              <XAxis
                dataKey="source"
                angle={-15}
                textAnchor="end"
                height={50}
              />
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