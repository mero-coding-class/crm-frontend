// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/RegisterUser.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BASE_URL } from "../config";

const canManage = (role) =>
  ["admin", "superadmin"].includes((role || "").toLowerCase());

const RegisterUser = () => {
  const { authToken } = useAuth();
  const navigate = useNavigate();

  const roleFromStorage = (localStorage.getItem("role") || "").toLowerCase();
  const [form, setForm] = useState({
    username: "",
    role: "sales_rep",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Force-blank on mount to defeat autofill
  useEffect(() => {
    setForm({ username: "", role: "sales_rep", password: "" });
  }, []);

  // Guard: only admin/superadmin
  if (!canManage(roleFromStorage)) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          403 – Forbidden
        </h2>
        <p className="text-gray-600">
          You don’t have permission to create users. Only <b>admin</b> and{" "}
          <b>superadmin</b> can access this page.
        </p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleClear = () => {
    setForm({ username: "", role: "sales_rep", password: "" });
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.username.trim() || !form.password) {
      setMsg({ type: "error", text: "Username and password are required." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          role: form.role, // "admin" | "sales_rep"
          password: form.password,
        }),
      });

      if (!res.ok) {
        let errText = "Failed to create user.";
        try {
          const data = await res.json();
          errText = data.detail || JSON.stringify(data);
        } catch {
          errText = await res.text();
        }
        throw new Error(errText);
      }

      setMsg({ type: "success", text: "User created successfully." });
      setForm({ username: "", role: "sales_rep", password: "" });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to create user." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Create User</h2>
      {msg.text && (
        <div
          className={`mb-4 p-3 rounded ${
            msg.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Trick the browser’s autofill */}
      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          type="text"
          name="fake-username"
          autoComplete="username"
          className="hidden"
          readOnly
        />
        <input
          type="password"
          name="fake-password"
          autoComplete="new-password"
          className="hidden"
          readOnly
        />

        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="off"
            placeholder="Enter new user's username"
            value={form.username}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="role"
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {/* Only admin & sales_rep per your requirement */}
            <option value="sales_rep">sales_rep</option>
            <option value="admin">admin</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Only admin/superadmin can create users.
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Set a password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-900"
              aria-label={showPw ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create User"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              setForm({ username: "", role: "sales_rep", password: "" })
            }
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            title="Add another"
          >
            Add Another
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:underline"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterUser;
