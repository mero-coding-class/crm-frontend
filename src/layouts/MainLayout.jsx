// C:/Users/aryal/Desktop/EDU_CRM/client/src/layouts/MainLayout.jsx

import React, { useContext, useState } from "react";
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
  BookOpenIcon,
} from "@heroicons/react/24/outline";

import { AuthContext } from "../context/AuthContext.jsx";

/** exact-role check: admin, superadmin, sales_rep */
const getRole = () => (localStorage.getItem("role") || "").trim().toLowerCase();
const canManage = (role) => role === "admin" || role === "superadmin";

const getUsername = () => (localStorage.getItem("username") || "").trim();

const getInitials = (name) => {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n[0].toUpperCase();
};

const MainLayout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const username = getUsername() || "User";
  const role = getRole(); // "admin" | "superadmin" | "sales_rep" | ""

  const handleLogout = () => {
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

          {/* Only admins & superadmins can see these */}
          {canManage(role) && (
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

          {canManage(role) && (
            <NavLink
              to="/courses/new"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <BookOpenIcon className="h-6 w-6 mr-3" />
              Create Course
            </NavLink>
          )}
        </nav>

        {/* User panel + Logout */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center p-3 mb-4 rounded-lg bg-gray-700">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-lg font-bold text-white mr-3">
              {getInitials(username)}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-200 font-medium">{username}</span>
              <span className="text-gray-400 text-xs">
                Role: {role || "unknown"}
              </span>
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
