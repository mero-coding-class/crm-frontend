import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { courseService } from "../services/api";

const allowedRoles = ["admin", "superadmin"];

const CreateCourse = () => {
  const { authToken, user } = useAuth();
  const navigate = useNavigate();

  // Show-only-if-admin/superadmin; also enforced on submit
  const role = useMemo(
    () => (user?.role || localStorage.getItem("role") || "").toLowerCase(),
    [user]
  );
  const isAllowed = allowedRoles.includes(role);

  const [rows, setRows] = useState([{ id: Date.now(), name: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState([]); // per-row statuses

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
    if (!isAllowed) return; // double-guard

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

    const run = async () => {
      const outcomes = [];
      for (const name of payloads) {
        try {
          const res = await courseService.createCourse(name, authToken);
          outcomes.push({
            ok: true,
            message: `Created: ${res.course_name || name}`,
          });
        } catch (err) {
          outcomes.push({
            ok: false,
            message: `Failed: ${name} — ${err.message}`,
          });
        }
      }
      setResults(outcomes);
    };

    await run();
    setSubmitting(false);
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

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Create Course</h1>
      <p className="text-gray-500 mb-6">
        Add one or more new courses. Only the <strong>course name</strong> is
        required.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.map((row, idx) => (
          <div key={row.id} className="flex items-center gap-3">
            <input
              type="text"
              placeholder={`Course name #${idx + 1} (e.g., Python Beginner)`}
              value={row.name}
              onChange={(e) => updateRow(row.id, e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
              required
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={submitting || rows.length === 1}
              className="px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
              title={
                rows.length === 1
                  ? "At least one field is required"
                  : "Remove row"
              }
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addRow}
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            + Add another course
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="px-5 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <ul className="space-y-1">
            {results.map((r, i) => (
              <li
                key={i}
                className={`text-sm ${
                  r.ok ? "text-green-700" : "text-red-700"
                }`}
              >
                {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreateCourse;
