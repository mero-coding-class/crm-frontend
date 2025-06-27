// src/components/LeadEditModal.jsx

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const LeadEditModal = ({ lead, onClose, onSave }) => {
  const [formData, setFormData] = useState(lead);

  useEffect(() => {
    setFormData(lead);
  }, [lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!lead) return null;

  const statusOptions = [
    "New",
    "Open",
    "Active",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Converted",
    "Lost",
    "Junk",
  ];
  const courseOptions = [
    "Select",
    "Scratch Beginner",
    "Scratch Advanced",
    "Python Beginner",
    "Python Advanced",
    "Web Development",
    "HTML & CSS",
    "Robotics",
    "Artificial Intelligence(AI)",
    "AI With Python",
  ];
  const sourceOptions = [
    "Select",
    "WhatsApp/Viber",
    "Facebook",
    "Website",
    "Email",
    "Office Visit",
    "Direct call",
  ];
  const classTypeOptions = ["Select", "Physical", "Online"];
  const shiftOptions = [
    "Select",
    "7 A.M. - 9 A.M.",
    "8 A.M. - 10 A.M.",
    "10 A.M. - 12 P.M.",
    "11 A.M. - 1 P.M.",
    "12 P.M. - 2 P.M.",
    "2 P.M. - 4 P.M.",
    "2:30 P.M. - 4:30 P.M.",
    "4 P.M. - 6 P.M.",
    "4:30 P.M. - 6:30 P.M.",
    "5 P.M - 7 P.M.",
    "6 P.M. - 7 P.M.",
    "6 P.M - 8 P.M.",
    "7 P.M. - 8 P.M.",
  ];
  const courseTypeOptions = [
    "Select",
    "Winter coding Camp",
    "Coding Kickstart",
    "Regular",
  ];
  const paymentTypeOptions = ["Select", "Cash", "Online"];

  const getFormattedDate = (dateString) => {
    try {
      if (!dateString || dateString === "N/A") return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">
            Edit Lead: {lead.studentName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Parents Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="parentsName"
              className="block text-sm font-medium text-gray-700"
            >
              Parents' Name
            </label>
            <input
              type="text"
              id="parentsName"
              name="parentsName"
              value={formData.parentsName || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Student Name */}
          <div>
            <label
              htmlFor="studentName"
              className="block text-sm font-medium text-gray-700"
            >
              Student Name
            </label>
            <input
              type="text"
              id="studentName"
              name="studentName"
              value={formData.studentName || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label
              htmlFor="contactWhatsapp"
              className="block text-sm font-medium text-gray-700"
            >
              WhatsApp
            </label>
            <input
              type="tel"
              id="contactWhatsapp"
              name="contactWhatsapp"
              value={formData.contactWhatsapp || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Age/Grade */}
          <div>
            <label
              htmlFor="ageGrade"
              className="block text-sm font-medium text-gray-700"
            >
              Age/Grade
            </label>
            <input
              type="text"
              id="ageGrade"
              name="ageGrade"
              value={formData.ageGrade || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Source */}
          <div>
            <label
              htmlFor="source"
              className="block text-sm font-medium text-gray-700"
            >
              Source
            </label>
            <select
              id="source"
              name="source"
              value={formData.source || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            >
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div>
            <label
              htmlFor="course"
              className="block text-sm font-medium text-gray-700"
            >
              Course
            </label>
            <select
              id="course"
              name="course"
              value={formData.course || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            >
              {courseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Class Type */}
          <div>
            <label
              htmlFor="classType"
              className="block text-sm font-medium text-gray-700"
            >
              Class Type
            </label>
            <select
              id="classType"
              name="classType"
              value={formData.classType || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            >
              {classTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Shift */}
          <div>
            <label
              htmlFor="shift"
              className="block text-sm font-medium text-gray-700"
            >
              Shift
            </label>
            <select
              id="shift"
              name="shift"
              value={formData.shift || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            >
              {shiftOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Previous Coding Exp */}
          <div>
            <label
              htmlFor="previousCodingExp"
              className="block text-sm font-medium text-gray-700"
            >
              Previous Coding Exp
            </label>
            <input
              type="text"
              id="previousCodingExp"
              name="previousCodingExp"
              value={formData.previousCodingExp || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Recent Call */}
          <div>
            <label
              htmlFor="recentCall"
              className="block text-sm font-medium text-gray-700"
            >
              Recent Call
            </label>
            <input
              type="date"
              id="recentCall"
              name="recentCall"
              value={getFormattedDate(formData.recentCall)}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Next Call */}
          <div>
            <label
              htmlFor="nextCall"
              className="block text-sm font-medium text-gray-700"
            >
              Next Call
            </label>
            <input
              type="date"
              id="nextCall"
              name="nextCall"
              value={getFormattedDate(formData.nextCall)}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Value */}
          <div>
            <label
              htmlFor="value"
              className="block text-sm font-medium text-gray-700"
            >
              Value
            </label>
            <input
              type="text"
              id="value"
              name="value"
              value={formData.value || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Course Type */}
          <div>
            <label
              htmlFor="courseType"
              className="block text-sm font-medium text-gray-700"
            >
              Course Type
            </label>
            <select
              id="courseType"
              name="courseType"
              value={formData.courseType || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            >
              {courseTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label
              htmlFor="paymentType"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Type
            </label>
            <select
              id="paymentType"
              name="paymentType"
              value={formData.paymentType || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            >
              {paymentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Laptop */}
          <div>
            <label
              htmlFor="laptop"
              className="block text-sm font-medium text-gray-700"
            >
              Laptop/PC
            </label>
            <select
              id="laptop"
              name="laptop"
              value={formData.laptop || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Workshop Batch */}
          <div>
            <label
              htmlFor="workshopBatch"
              className="block text-sm font-medium text-gray-700"
            >
              Workshop Batch
            </label>
            <input
              type="text"
              id="workshopBatch"
              name="workshopBatch"
              value={formData.workshopBatch || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Remarks */}
          <div className="md:col-span-3">
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700"
            >
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows="3"
              value={formData.remarks || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            ></textarea>
          </div>

          {/* Address */}
          <div className="md:col-span-3 text-lg font-semibold text-gray-800 border-t pt-4">
            Address
          </div>

          <div>
            <label
              htmlFor="temporaryAddress"
              className="block text-sm font-medium text-gray-700"
            >
              Temporary Address
            </label>
            <input
              type="text"
              id="temporaryAddress"
              name="temporaryAddress"
              value={formData.temporaryAddress || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="permanentAddress"
              className="block text-sm font-medium text-gray-700"
            >
              Permanent Address
            </label>
            <input
              type="text"
              id="permanentAddress"
              name="permanentAddress"
              value={formData.permanentAddress || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700"
            >
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="county"
              className="block text-sm font-medium text-gray-700"
            >
              County
            </label>
            <input
              type="text"
              id="county"
              name="county"
              value={formData.county || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="postCode"
              className="block text-sm font-medium text-gray-700"
            >
              Post Code
            </label>
            <input
              type="text"
              id="postCode"
              name="postCode"
              value={formData.postCode || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadEditModal;
