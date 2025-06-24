// C:/Users/aryal/Desktop/EDU_CRM/client/src/layouts/MainLayout.jsx

import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom'; // Import Outlet for nested routes
import { AuthContext } from '../App';
import {
  HomeIcon,
  UsersIcon, // For Leads/Students
  ArrowLeftOnRectangleIcon, // For Logout
  Bars3Icon, // For mobile menu toggle
  XMarkIcon, // For mobile menu close
} from '@heroicons/react/24/outline'; // Assuming you have heroicons installed

const MainLayout = () => { // Removed 'children' prop as Outlet handles it
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for mobile sidebar

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden p-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
          {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - Conditional rendering for mobile */}
      <aside className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4 flex flex-col transition-transform duration-300 ease-in-out z-40
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative md:flex`}>
        <div className="text-2xl font-bold mb-8 text-center">EDU CRM</div>

        <nav className="flex-grow space-y-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200
               ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`
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
               ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`
            }
            onClick={() => setSidebarOpen(false)} // Close sidebar on nav for mobile
          >
            <UsersIcon className="h-6 w-6 mr-3" />
            Leads
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
        {/*
          THE CHANGE: Use <Outlet /> to render nested routes
        */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;