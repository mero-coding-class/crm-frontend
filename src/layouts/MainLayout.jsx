// C:/Users/aryal/Desktop/EDU_CRM/client/src/layouts/MainLayout.jsx

import React, { useContext, useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// IMPORTANT: This path is set based on your previous clarification:
// - MainLayout.jsx is in 'C:/Users/aryal/Desktop/EDU_CRM/client/src/layouts/'
// - AuthContext.jsx is in 'C:/Users/aryal/Desktop/EDU_CRM/client/src/context/'
//
// To go from 'layouts/' to 'context/':
// 1. You go up one directory using '..' (this takes you from 'layouts/' to 'src/').
// 2. Then, you go down into the 'context/' directory.
// 3. Finally, you specify the filename 'AuthContext.jsx'.
//
// Therefore, the path '../context/AuthContext.jsx' is the **logically correct relative path**
// given the file structure you've indicated.
//
// IF THIS ERROR PERSISTS, YOU MUST CAREFULLY CHECK THE FOLLOWING ON YOUR LOCAL SYSTEM:
// 1.  **Exact Folder Names:** Ensure 'context' and 'layouts' folders are spelled
//     and cased exactly as in the path (e.g., 'context' all lowercase).
// 2.  **Exact File Name:** Ensure 'AuthContext.jsx' is spelled and cased exactly as in the path.
// 3.  **File Location:** Confirm that 'MainLayout.jsx' is truly in 'src/layouts/' and
//     'AuthContext.jsx' is truly in 'src/context/', both relative to 'client/src/'.
// 4.  **Restart Development Server:** Sometimes, build tools can cache paths.
//     Try stopping and restarting your React development server.
// 5.  **Clear Node Modules/Cache:** As a last resort, delete `node_modules` and `package-lock.json`
//     (or `yarn.lock`), run `npm install` (or `yarn install`), and then restart the server.

import { AuthContext } from "../context/AuthContext.jsx";

const MainLayout = () => {
  // Use the useContext hook to access the logout function from AuthContext
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for mobile sidebar

  const handleLogout = () => {
    logout(); // Call the logout function from AuthContext
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

      {/* Sidebar - Conditional rendering for mobile */}
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
              `flex items-center p-3 rounded-lg transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
            }
            onClick={() => setSidebarOpen(false)} // Close sidebar on nav for mobile
          >
            <HomeIcon className="h-6 w-6 mr-3" />
            Dashboard
          </NavLink>

          <NavLink
            to="/leads"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
            }
            onClick={() => setSidebarOpen(false)} // Close sidebar on nav for mobile
          >
            <UsersIcon className="h-6 w-6 mr-3" />
            Leads
          </NavLink>
          <NavLink
            to="/enrolled-students"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
            }
            onClick={() => setSidebarOpen(false)} // Close sidebar on nav for mobile
          >
            <UsersIcon className="h-6 w-6 mr-3" />
            Enrolled Students
          </NavLink>
          <NavLink
            to="/trash"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
            }
            onClick={() => setSidebarOpen(false)} // Close sidebar on nav for mobile
          >
            <UsersIcon className="h-6 w-6 mr-3" />
            Trash
          </NavLink>
          <NavLink
            to="/report"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`
            }
            onClick={() => setSidebarOpen(false)} // Close sidebar on nav for mobile
          >
            <UsersIcon className="h-6 w-6 mr-3" />
            Reports
          </NavLink>
          {/* Add more navigation links here */}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center p-3 mb-4 rounded-lg bg-gray-700">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-lg font-bold text-white mr-3">
              US {/* Placeholder for User Initials */}
            </div>
            <span className="text-gray-200">Administrator</span>
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
