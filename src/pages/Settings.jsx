import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Register from "./Register";
import CreateCourse from "./CreateCourse";

const Settings = () => {
  const { user } = useAuth();
  const role = useMemo(
    () => (user?.role || localStorage.getItem("role") || "").toLowerCase(),
    [user]
  );
  const isAdminLike = ["admin", "superadmin"].includes(role);
  const [tab, setTab] = useState("users");

  if (!isAdminLike) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-red-600">Only Admins and Superadmins can access Settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <p className="text-gray-500 mb-4">Manage users, teachers, and courses.</p>

        <div className="inline-flex rounded-md border border-gray-200 overflow-hidden mb-6">
          <button
            className={`px-4 py-2 text-sm ${
              tab === "users" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setTab("users")}
          >
            Users & Teachers
          </button>
          <button
            className={`px-4 py-2 text-sm border-l ${
              tab === "courses" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setTab("courses")}
          >
            Courses
          </button>
        </div>

        {tab === "users" ? (
          <Register />
        ) : (
          <CreateCourse />
        )}
      </div>
    </div>
  );
};

export default Settings;
