import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { courseService } from "../services/api";

const allowedRoles = ["admin", "superadmin"];
const INITIAL_VISIBLE_COUNT = 3;

const CreateCourse = () => {
  const { authToken, user } = useAuth();
  const navigate = useNavigate();

  const role = useMemo(
    () => (user?.role || localStorage.getItem("role") || "").toLowerCase(),
    [user]
  );
  const isAllowed = allowedRoles.includes(role);

  const [rows, setRows] = useState([{ id: Date.now(), name: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [visibleCoursesCount, setVisibleCoursesCount] = useState(
    INITIAL_VISIBLE_COUNT
  );

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        let data = await courseService.getCourses(authToken);
        // Some backends return a paginated object { results: [...] }
        if (data && !Array.isArray(data) && Array.isArray(data.results)) {
          data = data.results;
        }
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    if (authToken) fetchCourses();
  }, [authToken]);

  // Multi-select functionality
  const handleSelectCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) {
      alert("Please select at least one course to delete.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedCourses.length} courses?`
      )
    )
      return;

    try {
      for (const id of selectedCourses) {
        await courseService.deleteCourse(id, authToken);
      }
      setCourses((prev) => prev.filter((c) => !selectedCourses.includes(c.id)));
      setSelectedCourses([]);
      alert("Selected courses deleted successfully.");
    } catch (err) {
      alert("Failed to delete courses: " + err.message);
    }
  };

  const addRow = () => {
    setRows((prev) => [...prev, { id: Date.now() + Math.random(), name: "" }]);
  };

  const removeRow = (id) => {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev
    );
  };

  const updateRow = (id, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: value } : r))
    );
  };

  const handleCancel = () => navigate(-1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllowed) return;

    const payloads = rows
      .map((r) => (r.name || "").trim())
      .filter((name) => name.length > 0);

    if (payloads.length === 0) {
      setResults([
        { ok: false, message: "Please enter at least one course name." },
      ]);
      return;
    }

    setSubmitting(true);
    setResults([]);

    const outcomes = [];
    for (const name of payloads) {
      try {
        const res = await courseService.createCourse(name, authToken);
        outcomes.push({
          ok: true,
          message: `Created: ${res.course_name || name}`,
        });
        setCourses((prev) => [...prev, res]);
      } catch (err) {
        outcomes.push({
          ok: false,
          message: `Failed: ${name} — ${err.message}`,
        });
      }
    }
    setResults(outcomes);
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await courseService.deleteCourse(id, authToken);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Failed to delete course: " + err.message);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;
    try {
      const updated = await courseService.updateCourse(
        editingCourse.id,
        editingCourse.course_name,
        authToken
      );
      setCourses((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setEditingCourse(null);
    } catch (err) {
      alert("Failed to update course: " + err.message);
    }
  };

  // Load more courses
  const handleLoadMore = () => {
    setVisibleCoursesCount((prevCount) => prevCount + 3);
  };

  // See all courses
  const handleSeeAll = () => {
    setVisibleCoursesCount(courses.length);
  };

  // Show less courses
  const handleShowLess = () => {
    setVisibleCoursesCount(INITIAL_VISIBLE_COUNT);
  };

  if (!isAllowed) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Create Course</h1>
        <p className="text-red-600">
          You don’t have permission to create courses. (Admins and Superadmins
          only)
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  const coursesToDisplay = courses.slice(0, visibleCoursesCount);
  const hasMoreCourses = courses.length > visibleCoursesCount;
  const isAllCoursesVisible = courses.length <= visibleCoursesCount;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Courses</h1>

      {/* --- CREATE FORM --- */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold text-gray-800">
          Create New Course(s)
        </h2>
        {rows.map((row, idx) => (
          <div key={row.id} className="flex items-center gap-3">
            <input
              type="text"
              placeholder={`Course name #${idx + 1}`}
              value={row.name}
              onChange={(e) => updateRow(row.id, e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={submitting}
              required
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={submitting || rows.length === 1}
              className="px-4 py-3 rounded-md bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={addRow}
            disabled={submitting}
            className="px-5 py-2.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
          >
            + Add another course
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Results</h2>
          <ul className="space-y-1">
            {results.map((r, i) => (
              <li
                key={i}
                className={`p-2 rounded ${
                  r.ok ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                }`}
              >
                {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- COURSES LIST --- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">All Courses</h2>
        {selectedCourses.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Selected ({selectedCourses.length})
          </button>
        )}
      </div>
      {loadingCourses ? (
        <p className="text-gray-500">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">No courses available.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelectedCourses(
                        e.target.checked ? courses.map((c) => c.id) : []
                      )
                    }
                    checked={
                      selectedCourses.length === courses.length &&
                      courses.length > 0
                    }
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coursesToDisplay.map((course) => (
                <tr
                  key={course.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleSelectCourse(course.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {course.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {editingCourse?.id === course.id ? (
                      <input
                        type="text"
                        value={editingCourse.course_name}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            course_name: e.target.value,
                          })
                        }
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    ) : (
                      course.course_name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingCourse?.id === course.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleUpdate}
                          className="p-1.5 rounded-md text-green-600 hover:bg-green-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingCourse(null)}
                          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-1.5 rounded-md text-yellow-500 hover:bg-yellow-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMoreCourses || visibleCoursesCount > INITIAL_VISIBLE_COUNT ? (
        <div className="mt-4 flex justify-center space-x-4">
          {visibleCoursesCount > INITIAL_VISIBLE_COUNT && (
            <button
              onClick={handleShowLess}
              className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Show Less
            </button>
          )}
          {hasMoreCourses && (
            <button
              onClick={handleSeeAll}
              className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              See All Courses
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default CreateCourse;
