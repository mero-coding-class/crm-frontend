import React, { useEffect, useState } from "react";

// Helper to build a courses lookup map from fetched course objects
const buildCoursesMap = (data = []) => {
  const map = {};
  if (!Array.isArray(data)) return map;
  data.forEach((c) => {
    const id = c.id ?? c.pk ?? c._id ?? c.course_id ?? null;
    const name = c.course_name || c.name || c.title || c.course || "";
    if (id != null) map[String(id)] = name;
    if (name) map[String(name).toLowerCase()] = name;
  });
  return map;
};

const TopCoursesTable = ({
  courses = [],
  coursesMap: propCoursesMap = null,
  authToken = null,
}) => {
  const [localMap, setLocalMap] = useState(propCoursesMap || {});

  useEffect(() => {
    // prefer parent-provided coursesMap if available
    if (propCoursesMap && Object.keys(propCoursesMap).length > 0) {
      setLocalMap(propCoursesMap);
      return;
    }

    let mounted = true;
    const fetchCourses = async () => {
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Token ${authToken}`;

      try {
        const res = await fetch(`${BASE_URL}/courses/`, {
          method: "GET",
          headers,
          credentials: authToken ? "include" : "same-origin",
        });
        if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        const map = buildCoursesMap(data);
        if (Object.keys(map).length > 0) {
          setLocalMap(map);
          return;
        }
        // If courses endpoint returned empty, fall back to enrollments which may include course_name
      } catch (err) {
        console.warn("TopCoursesTable: failed to fetch courses:", err);
        // continue to try enrollments
      }

      // Fallback: try enrollments endpoint to extract course_name fields
      try {
        const enrRes = await fetch(`${BASE_URL}/enrollments/`, {
          method: "GET",
          headers,
          credentials: authToken ? "include" : "same-origin",
        });
        if (!enrRes.ok)
          throw new Error(`Failed to fetch enrollments: ${enrRes.status}`);
        const enrData = await enrRes.json();
        if (!mounted) return;
        // Build a map from enrollment.course_name values
        const map = {};
        if (Array.isArray(enrData)) {
          enrData.forEach((e, idx) => {
            const cname =
              e.course_name || e.course?.course_name || e.course || null;
            const cid = e.course_id ?? e.course?.id ?? e.id ?? null;
            if (cname) map[String(cname).toLowerCase()] = cname;
            if (cid != null) map[String(cid)] = cname || String(cid);
          });
        }
        if (Object.keys(map).length > 0) setLocalMap(map);
      } catch (err) {
        console.warn("TopCoursesTable: failed to fetch enrollments:", err);
      }
    };
    fetchCourses();
    return () => {
      mounted = false;
    };
  }, [propCoursesMap, authToken]);
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Top Courses by Enrollment
      </h3>

      {courses.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No top courses data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollments
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course, index) => {
                // Support three shapes for `course` entries:
                // 1) { name: "Python Beginner", enrollments, revenue }
                // 2) { id: 4, course_name: "Python Beginner" }
                // 3) { name: <id or name> } (existing behavior)
                const rawName =
                  course.course_name ?? course.name ?? course.id ?? null;
                // If the item itself looks like {id, course_name}, prefer course_name
                const providedName = course.course_name || null;
                // If dashboard already provided a readable name, prefer it.
                // Only attempt lookups when rawName looks like an id or when a mapping exists.
                let resolved = "Unknown Course";
                if (rawName == null) {
                  resolved = "Unknown Course";
                } else if (
                  typeof rawName === "string" &&
                  rawName.trim() !== ""
                ) {
                  // if it's purely numeric (id), look up in map
                  if (/^\d+$/.test(rawName)) {
                    resolved = localMap[String(rawName)] || `Course ${rawName}`;
                  } else {
                    // prefer showing the provided name (already human-readable)
                    // but fall back to map lookups to correct casing or alternate names
                    resolved =
                      providedName ||
                      rawName ||
                      localMap[String(rawName)] ||
                      localMap[String(rawName).toLowerCase()] ||
                      `Course ${rawName}`;
                  }
                } else {
                  // non-string (number), try mapping
                  resolved = localMap[String(rawName)] || String(rawName);
                }
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {resolved}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {course.enrollments}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopCoursesTable;
