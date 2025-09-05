import React from "react";

/** Map your app statuses to badge colors */
const getStatusBadgeClasses = (status = "") => {
  const s = status.toLowerCase();
  if (s === "new") return "bg-blue-100 text-blue-800";
  if (s === "open" || s === "average" || s === "followup")
    return "bg-yellow-100 text-yellow-800";
  if (s === "interested") return "bg-indigo-100 text-indigo-800";
  if (s === "inprogress") return "bg-purple-100 text-purple-800";
  if (s === "active") return "bg-green-100 text-green-800";
  if (s === "converted") return "bg-teal-100 text-teal-800";
  if (s === "lost" || s === "junk") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

/** Course name -> pill color */
const getCoursePillClasses = (course = "") => {
  const c = course.trim().toLowerCase();
  if (c === "python beginner") return "bg-sky-100 text-sky-800";
  if (c === "python advance" || c === "python advanced")
    return "bg-blue-100 text-blue-800";
  if (c === "scratch beginner") return "bg-orange-100 text-orange-800";
  if (c === "scratch advance" || c === "scratch advanced")
    return "bg-amber-100 text-amber-800";
  if (c === "html/css" || c === "html / css")
    return "bg-rose-100 text-rose-800";
  if (c === "webdevelopment" || c === "web development")
    return "bg-cyan-100 text-cyan-800";
  if (c === "robotics") return "bg-lime-100 text-lime-800";
  if (c === "data science") return "bg-emerald-100 text-emerald-800";
  if (c === "advance ai" || c === "advanced ai")
    return "bg-violet-100 text-violet-800";
  return "bg-gray-100 text-gray-800";
};

const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d; // show raw if unparsable
  return dt.toLocaleDateString();
};

const LatestLeadsTable = ({ leads = [] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Latest Lead Registrations
      </h3>

      {leads.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent leads.</p>
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
                  Course
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered On
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lead.studentName || "—"}
                  </td>

                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lead.email || "—"}
                  </td>

                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getCoursePillClasses(
                        lead.course
                      )}`}
                      title={lead.course}
                    >
                      {lead.course || "—"}
                    </span>
                  </td>

                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(
                        lead.status
                      )}`}
                    >
                      {lead.status || "—"}
                    </span>
                  </td>

                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(lead.registeredOn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LatestLeadsTable;
