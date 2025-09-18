import React, { useState, useEffect } from 'react';
import { leadService } from "../services/api";
import { PlusIcon } from "@heroicons/react/24/outline"; // Assuming heroicons is installed

const LeadForm = ({ leadToEdit, onSaveSuccess, token }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "New", // Default status
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (leadToEdit) {
      setFormData(leadToEdit);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        status: "New",
      });
    }
  }, [leadToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (leadToEdit) {
        // Prefer backend numeric id when available, fall back to _id
        const serverId = leadToEdit.id || leadToEdit._id;
        await leadService.updateLead(serverId, formData, token);
        setSuccess("Lead updated successfully!");
      } else {
        await leadService.addLead(formData, token);
        setSuccess("Lead created successfully!");
        setFormData({ name: "", email: "", phone: "", status: "New" }); // Clear form on create
      }
      if (onSaveSuccess) {
        onSaveSuccess(); // Trigger refresh in parent component
      }
    } catch (err) {
      console.error("Lead save error:", err);
      setError(err.message || "Failed to save lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {" "}
      {/* Replaced card */}
      <h2 className="text-2xl font-semibold mb-4">
        {leadToEdit ? "Edit Lead" : "Create New Lead"}
      </h2>{" "}
      {/* Replaced font-semibold */}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-500 mb-4">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" // Replaced input-field
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" // Replaced input-field
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="phone"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Phone:
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" // Replaced input-field
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="status"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Status:
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" // Replaced input-field
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Closed">Closed</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" // Replaced btn-primary
        >
          {loading ? "Saving..." : leadToEdit ? "Update Lead" : "Create Lead"}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;