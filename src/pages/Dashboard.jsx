// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Dashboard.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/common/Loader";
import DelayedLoader from "../components/common/DelayedLoader";

import StatCard from "../components/dashboard/StatCard";
import LatestLeadsTable from "../components/dashboard/LatestLeadsTable";
import TopCoursesTable from "../components/dashboard/TopCoursesTable";

// 👉 use your real API service
import { leadService } from "../services/api";
import { BASE_URL } from "../config";

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
import LeadMap from "../components/dashboard/LeadMap";

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
  const [coursesMap, setCoursesMap] = useState({});
  const [enrollmentsTopCourses, setEnrollmentsTopCourses] = useState([]);
  const [enrollmentsTrendData, setEnrollmentsTrendData] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

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

  // Fetch courses so we can resolve course names for dashboard tables
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
        };
        let usingAuth = false;
        if (authToken) {
          headers.Authorization = `Token ${authToken}`;
          usingAuth = true;
        }

        // Attempt to fetch courses with or without Authorization depending on availability
        const res = await fetch(`${BASE_URL}/courses/`, {
          method: "GET",
          headers,
          // only include credentials when auth token present to avoid CORS surprises
          credentials: authToken ? "include" : "same-origin",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch courses: ${res.status}`);
        }

        const data = await res.json();
        // build a lookup map by common id keys and by name fallback (prefer course_name)
        const map = {};
        if (Array.isArray(data)) {
          data.forEach((c) => {
            const id = c.id ?? c.pk ?? c._id ?? c.course_id ?? null;
            const name = c.course_name || c.name || c.title || c.course || "";
            if (id != null) map[String(id)] = name;
            if (name) map[String(name).toLowerCase()] = name;
          });
        }
        setCoursesMap(map);
        console.info(
          `Fetched courses for dashboard (auth used: ${usingAuth}) - ${
            Object.keys(map).length
          } entries.`
        );
        // Also try to fetch enrollments to build fallback top-courses if needed
        try {
          const enrRes = await fetch(`${BASE_URL}/enrollments/`, {
            method: "GET",
            headers,
            credentials: authToken ? "include" : "same-origin",
          });
          if (enrRes.ok) {
            const enrData = await enrRes.json();
            // keep the raw enrollments for dashboard aggregates (enrolled students, revenue)
            setEnrollments(Array.isArray(enrData) ? enrData : []);
            const map2 = new Map();
            if (Array.isArray(enrData)) {
              enrData.forEach((e) => {
                const cname =
                  e.course_name ||
                  e.course?.course_name ||
                  e.course ||
                  "Unknown";
                const rev = Number(e.value) || 0;
                const prev = map2.get(cname) || { enrollments: 0, revenue: 0 };
                map2.set(cname, {
                  enrollments: prev.enrollments + 1,
                  revenue: prev.revenue + rev,
                });
              });
            }
            const fallback = Array.from(map2.entries())
              .map(([name, data]) => ({
                name,
                enrollments: data.enrollments,
                revenue: `Rs ${data.revenue.toLocaleString()}`,
              }))
              .sort((a, b) => b.enrollments - a.enrollments)
              .slice(0, 7);
            setEnrollmentsTopCourses(fallback);

            // Build enrollment trends fallback (monthly counts) from enrollment records
            try {
              const trendMap = new Map();
              const parseDate = (d) => {
                if (!d) return null;
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? null : dt;
              };
              enrData.forEach((e) => {
                const d =
                  e.add_date ||
                  e.addDate ||
                  e.created_at ||
                  e.created_on ||
                  e.createdAt ||
                  e.createdOn ||
                  null;
                const dt = parseDate(d);
                if (!dt) return;
                const key = `${dt.getFullYear()}-${String(
                  dt.getMonth() + 1
                ).padStart(2, "0")}`;
                trendMap.set(key, (trendMap.get(key) || 0) + 1);
              });
              const trendArr = Array.from(trendMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([monthYear, cnt]) => ({
                  month: monthYear.substring(5),
                  students: cnt,
                }));
              setEnrollmentsTrendData(trendArr);
            } catch (err) {
              console.warn(
                "Failed to build enrollment trends from enrollments:",
                err
              );
            }
          }
        } catch (err) {
          console.warn(
            "Failed to fetch enrollments for fallback top courses:",
            err
          );
        }
      } catch (err) {
        // non-fatal for dashboard; log for debugging
        console.warn("Failed to fetch courses for dashboard:", err);
      }
    };
    fetchCourses();
  }, [authToken]);

  // Helper: parse date safely
  const toDate = (d) => {
    if (!d) return null;
    const t = new Date(d);
    return isNaN(t.getTime()) ? null : t;
  };

  // Helper: resolve possible add/created date fields from lead objects
  const getLeadAddDate = (lead) => {
    return (
      lead.addDate ||
      lead.add_date ||
      lead.created_at ||
      lead.created_on ||
      lead.createdAt ||
      lead.createdOn ||
      lead.added_on ||
      lead.addedAt ||
      null
    );
  };

  // Helper: resolve next call date from various possible fields
  const getNextCallDate = (lead) => {
    return (
      lead.nextCall ||
      lead.next_call ||
      lead.next_call_date ||
      lead.nextCallAt ||
      null
    );
  };

  // Build all dashboard aggregates from real leads + enrollments
  const dashboardData = useMemo(() => {
    if (
      (!allLeads || allLeads.length === 0) &&
      (!enrollments || enrollments.length === 0)
    )
      return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalLeads = allLeads.length;

    // Define "enrolled" as status === Converted
    // Prefer authoritative enrollments endpoint for enrolled students count
    const enrolledLeads = allLeads.filter(
      (l) => (l.status || "").toLowerCase() === "converted"
    );
    const totalEnrolledStudents =
      enrollments && enrollments.length > 0
        ? enrollments.length
        : enrolledLeads.length;

    // New leads in current month (by addDate)
    const newLeadsThisMonth = allLeads.filter((lead) => {
      const dt = toDate(getLeadAddDate(lead));
      return (
        dt && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear
      );
    }).length;

    // Revenue this month — prefer to compute from enrollments (authoritative payments)
    let revenueThisMonth = 0;
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach((e) => {
        // parse a date to determine which month this enrollment/payment applies to
        const dateStr =
          e.starting_date ||
          e.start_date ||
          e.add_date ||
          e.addDate ||
          e.created_at ||
          e.createdOn ||
          e.createdAt ||
          null;
        const dt = toDate(dateStr);
        if (!dt) return;
        if (dt.getMonth() !== currentMonth || dt.getFullYear() !== currentYear)
          return;

        // Determine payment amount: prefer explicit total_payment, otherwise sum installments or fallback to value
        const totalPayment =
          Number(e.total_payment) ||
          (Number(e.first_installment) || 0) +
            (Number(e.second_installment) || 0) +
            (Number(e.third_installment) || 0) ||
          Number(e.value) ||
          0;
        revenueThisMonth += totalPayment;
      });
    } else {
      // fallback: use converted leads' value
      enrolledLeads.forEach((lead) => {
        const dt = toDate(getLeadAddDate(lead));
        const val = Number(lead.value) || 0;
        if (
          dt &&
          dt.getMonth() === currentMonth &&
          dt.getFullYear() === currentYear
        ) {
          revenueThisMonth += val;
        }
      });
    }

    // Upcoming calls/classes in next 7 days (by nextCall)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    const upcomingClassesCalls = allLeads.filter((lead) => {
      const dt = toDate(getNextCallDate(lead));
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
      const dt = toDate(getLeadAddDate(lead));
      if (!dt) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      enrollByMonth.set(key, (enrollByMonth.get(key) || 0) + 1);
    });
    let enrollmentTrends = Array.from(enrollByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthYear, students]) => ({
        month: monthYear.substring(5), // "MM"
        students,
      }));

    // If no converted leads are present to build trends, fall back to enrollment records
    if (
      (!enrollmentTrends || enrollmentTrends.length === 0) &&
      enrollmentsTrendData &&
      enrollmentsTrendData.length > 0
    ) {
      enrollmentTrends = enrollmentsTrendData;
    }

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
    const resolveCourseName = (lead) => {
      // prefer explicit backend-provided course_name on the lead
      if (lead.course_name) return lead.course_name;

      // Try to find a matching enrollment (the enrollments endpoint often stores course_name)
      try {
        if (enrollments && enrollments.length) {
          const leadId = lead.id ?? lead._id ?? lead.pk ?? lead.lead ?? null;
          if (leadId != null) {
            const match = enrollments.find((e) => {
              // enrollment may store the lead as `lead` numeric id or nested object
              if (e.lead == null) return false;
              return (
                String(e.lead) === String(leadId) ||
                String(e.lead?.id) === String(leadId)
              );
            });
            if (match)
              return (
                match.course_name ||
                match.course?.course_name ||
                match.course ||
                ""
              );
          }
        }
      } catch (err) {
        // ignore and continue to other fallbacks
      }

      // lead.course may already be a name
      if (lead.course && typeof lead.course === "string") {
        const lc = lead.course.toLowerCase();
        return coursesMap[lead.course] || coursesMap[lc] || lead.course;
      }

      // lead.course may be an id
      if (
        lead.course != null &&
        (typeof lead.course === "number" || typeof lead.course === "string")
      ) {
        return coursesMap[String(lead.course)] || String(lead.course);
      }

      // nested object
      if (lead.course && typeof lead.course === "object") {
        return (
          lead.course.course_name ||
          lead.course.name ||
          coursesMap[String(lead.course.id)] ||
          ""
        );
      }
      return "";
    };

    const latestLeads = [...allLeads]
      .sort(
        (a, b) =>
          (toDate(getLeadAddDate(b))?.getTime() || 0) -
          (toDate(getLeadAddDate(a))?.getTime() || 0)
      )
      .slice(0, 10)
      .map((lead) => ({
        _id: lead._id,
        studentName: lead.studentName || lead.student_name || "",
        email: lead.email || lead.email_address || "",
        // Resolve course name using fetched courses when possible
        course:
          resolveCourseName(lead) || lead.course_name || lead.course || "",
        status: lead.status,
        registeredOn: getLeadAddDate(lead),
      }));

    const topCoursesMap = new Map(); // course -> { enrollments, revenue }
    enrolledLeads.forEach((lead) => {
      const courseName =
        resolveCourseName(lead) ||
        lead.course_name ||
        lead.course ||
        "Unknown Course";
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
  }, [allLeads, coursesMap, enrollments, enrollmentsTrendData]);

  if (loading)
    return <DelayedLoader message="Loading dashboard..." minMs={2000} />;

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
        <TopCoursesTable
          courses={
            dashboardData.topCourses.length
              ? dashboardData.topCourses
              : enrollmentsTopCourses
          }
          coursesMap={coursesMap}
          authToken={authToken}
        />
      </div>

      {/* Map: show leads on map (defaults to Nepal/Kathmandu) */}
      <ChartContainer
        title="Geographical Lead Distribution"
        description="Visualizing where your leads are coming from. Search by city or country."
      >
        <LeadMap
          leads={dashboardData.latestLeads}
          defaultCountry="Nepal"
          defaultCity="Kathmandu"
        />
      </ChartContainer>
    </div>
  );
};

export default Dashboard;
