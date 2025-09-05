// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Dashboard.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/common/Loader";

import StatCard from "../components/dashboard/StatCard";
import LatestLeadsTable from "../components/dashboard/LatestLeadsTable";
import TopCoursesTable from "../components/dashboard/TopCoursesTable";

// 👉 use your real API service
import { leadService } from "../services/api";

// Recharts
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

// Icons
import {
  UsersIcon,
  AcademicCapIcon,
  PlusIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const ChartContainer = ({ title, description, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm mb-4">{description}</p>
    <div className="flex-grow min-h-[250px]">{children}</div>
  </div>
);

const Dashboard = () => {
  const { authToken } = useAuth();
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pie segment colors
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

  // Load real leads from backend
  useEffect(() => {
    const fetchLeadsData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!authToken) throw new Error("Not authenticated.");
        const leads = await leadService.getLeads(authToken);
        setAllLeads(Array.isArray(leads) ? leads : []);
      } catch (err) {
        setError(err.message || "Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    };
    fetchLeadsData();
  }, [authToken]);

  // Helper: parse date safely
  const toDate = (d) => {
    if (!d) return null;
    const t = new Date(d);
    return isNaN(t.getTime()) ? null : t;
  };

  // Build all dashboard aggregates from real leads
  const dashboardData = useMemo(() => {
    if (!allLeads || allLeads.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalLeads = allLeads.length;

    // Define "enrolled" as status === Converted
    const enrolledLeads = allLeads.filter(
      (l) => (l.status || "").toLowerCase() === "converted"
    );
    const totalEnrolledStudents = enrolledLeads.length;

    // New leads in current month (by addDate)
    const newLeadsThisMonth = allLeads.filter((lead) => {
      const dt = toDate(lead.addDate);
      return (
        dt && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear
      );
    }).length;

    // Revenue this month — if you track value per lead, sum value for Converted in current month
    // Adjust this logic if your backend uses a different revenue field.
    let revenueThisMonth = 0;
    enrolledLeads.forEach((lead) => {
      const dt = toDate(lead.addDate);
      const val = Number(lead.value) || 0;
      if (
        dt &&
        dt.getMonth() === currentMonth &&
        dt.getFullYear() === currentYear
      ) {
        revenueThisMonth += val;
      }
    });

    // Upcoming calls/classes in next 7 days (by nextCall)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    const upcomingClassesCalls = allLeads.filter((lead) => {
      const dt = toDate(lead.nextCall);
      return dt && dt >= today && dt <= sevenDaysFromNow;
    }).length;

    // Chart: status distribution
    const statusCounts = new Map();
    allLeads.forEach((lead) => {
      const s = lead.status || "Unknown";
      statusCounts.set(s, (statusCounts.get(s) || 0) + 1);
    });
    const leadStatusDistribution = Array.from(statusCounts.entries()).map(
      ([name, value]) => ({ name, value })
    );

    // Chart: enrollment trends by month (for Converted)
    const enrollByMonth = new Map(); // key "YYYY-MM" -> count
    enrolledLeads.forEach((lead) => {
      const dt = toDate(lead.addDate);
      if (!dt) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      enrollByMonth.set(key, (enrollByMonth.get(key) || 0) + 1);
    });
    const enrollmentTrends = Array.from(enrollByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthYear, students]) => ({
        month: monthYear.substring(5), // "MM"
        students,
      }));

    // Chart: leads by source
    const bySource = new Map();
    allLeads.forEach((lead) => {
      const src = lead.source || "Unknown";
      bySource.set(src, (bySource.get(src) || 0) + 1);
    });
    const leadsBySource = Array.from(bySource.entries()).map(
      ([source, leads]) => ({
        source,
        leads,
      })
    );

    // Tables
    const latestLeads = [...allLeads]
      .sort(
        (a, b) =>
          (toDate(b.addDate)?.getTime() || 0) -
          (toDate(a.addDate)?.getTime() || 0)
      )
      .slice(0, 10)
      .map((lead) => ({
        _id: lead._id,
        studentName: lead.studentName,
        email: lead.email,
        // Prefer course_name if your mapping provides it; fall back to course
        course: lead.course_name || lead.course || "",
        status: lead.status,
        registeredOn: lead.addDate,
      }));

    const topCoursesMap = new Map(); // course -> { enrollments, revenue }
    enrolledLeads.forEach((lead) => {
      const courseName = lead.course_name || lead.course || "Unknown Course";
      const prev = topCoursesMap.get(courseName) || {
        enrollments: 0,
        revenue: 0,
      };
      topCoursesMap.set(courseName, {
        enrollments: prev.enrollments + 1,
        revenue: prev.revenue + (Number(lead.value) || 0),
      });
    });
    const topCourses = Array.from(topCoursesMap.entries())
      .map(([name, data]) => ({
        name,
        enrollments: data.enrollments,
        revenue: `$${data.revenue.toLocaleString()}`,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 7);

    return {
      stats: {
        totalLeads,
        totalEnrolledStudents,
        newLeadsThisMonth,
        revenueThisMonth: `Rs ${revenueThisMonth.toLocaleString()}`,
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
  }, [allLeads]);

  if (loading) return <Loader />;

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

      {/* Stat Cards */}
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
          description='Leads with status "Converted"'
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
          description='Sum of "value" for Converted leads'
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

        <ChartContainer
          title="Student Enrollment Trends"
          description='Monthly trend of "Converted" leads (by Add Date).'
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dashboardData.charts.enrollmentTrends}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
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
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LatestLeadsTable leads={dashboardData.latestLeads} />
        <TopCoursesTable courses={dashboardData.topCourses} />
      </div>

      {/* Optional map placeholder */}
      <ChartContainer
        title="Geographical Lead Distribution"
        description="Visualizing where your leads are coming from globally."
      >
        <div className="flex-grow flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded-md text-gray-400 text-center text-sm">
          <GlobeAltIcon className="h-10 w-10 mr-2 text-gray-300" />
          <p>Map component will go here</p>
        </div>
      </ChartContainer>
    </div>
  );
};

export default Dashboard;
