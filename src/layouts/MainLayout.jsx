// C:/Users/aryal/Desktop/EDU_CRM/client/src/layouts/MainLayout.jsx

import React, { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  FolderOpenIcon,
  XMarkIcon,
  UserMinusIcon,
  UserPlusIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext.jsx";

const MainLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get role/username from context, fallback to localStorage
  const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();
  const username = user?.username || localStorage.getItem("username") || "User";

  const canManageUsers = role === "admin" || role === "superadmin"; // for Create User
  const canCreateCourse = canManageUsers; // for Create Course

  // initials avatar (first 2 characters of username)
  const initials = (username || "U")
    .toString()
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);

  const handleLogout = () => {
    // Clear any extra persisted fields if you stored them during login
    try {
      localStorage.removeItem("username");
      localStorage.removeItem("role");
    } catch {}
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        >
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4 flex flex-col transition-transform duration-300 ease-in-out z-40
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:relative md:flex`}
      >
        <div className="text-2xl font-bold mb-8 text-center">EDU CRM</div>

        <nav className="flex-grow space-y-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-gray-700 text-gray-300"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <HomeIcon className="h-6 w-6 mr-3" />
            Dashboard
          </NavLink>

          <NavLink
            to="/leads"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-gray-700 text-gray-300"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <UserPlusIcon className="h-6 w-6 mr-3" />
            Leads
          </NavLink>

          <NavLink
            to="/enrolled-students"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-gray-700 text-gray-300"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <UserGroupIcon className="h-6 w-6 mr-3" />
            Enrolled Students
          </NavLink>

          <NavLink
            to="/trash"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-gray-700 text-gray-300"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <UserMinusIcon className="h-6 w-6 mr-3" />
            Trash
          </NavLink>

          <NavLink
            to="/report"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-gray-700 text-gray-300"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <FolderOpenIcon className="h-6 w-6 mr-3" />
            Reports
          </NavLink>

          {/* Create User (admins only) */}
          {canManageUsers && (
            <NavLink
              to="/register-user"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <PlusCircleIcon className="h-6 w-6 mr-3" />
              Create User
            </NavLink>
          )}

          {/* Create Course (admins only) */}
          {canCreateCourse && (
            <NavLink
              to="/create-course"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <PlusCircleIcon className="h-6 w-6 mr-3" />
              Create Course
            </NavLink>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center p-3 mb-4 rounded-lg bg-gray-700">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-lg font-bold text-white mr-3 select-none">
              {initials || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-200 font-semibold">{username}</span>
              {role && (
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {role}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
