// src/components/AddLeadModal.jsx

import React, { useState, useRef, useEffect } from "react"; // Import useRef and useEffect
import { XMarkIcon } from "@heroicons/react/24/outline";

const AddLeadModal = ({ onClose, onSave }) => {
  // Initial state for a new, empty lead
  const [formData, setFormData] = useState({
    _id: `new-${Date.now()}`, // Generate a unique ID for mock data
    studentName: "",
    parentsName: "",
    email: "",
    phone: "",
    ageGrade: "",
    contactWhatsapp: "",
    course: "",
    source: "",
    recentCall: "",
    nextCall: "",
    status: "New", // Default status
    address: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    postCode: "",
    classType: "",
    value: "",
    adsetName: "",
    remarks: "",
    shift: "",
    paymentType: "",
    // Changed 'laptop' to 'device' here to match the new field name
    device: "", // New field name and default empty value
    invoice: [], // Assuming invoice is an array of files/strings
    courseType: "",
    previousCodingExp: "",
    workshopBatch: "",
  });

  // Create a ref for the inner modal content div
  const modalContentRef = useRef(null);

  // Handle outside click logic
  const handleOverlayClick = (event) => {
    // If the click happened directly on the overlay div (the one with the ref),
    // and not on the modal's content, then close the modal.
    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(event.target)
    ) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData); // Pass the new lead data up to the parent component
  };

  // Dropdown options based on your request
  const statusOptions = [
    "New",
    "Open",
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
    "7 P.M. - 8 P.M.",
    "7 P.M. - 9 P.M.",
  ];
  const courseTypeOptions = [
    "Select",
    "Winter coding Camp",
    "Coding Kickstart",
    "Regular",
  ];
  const paymentTypeOptions = ["Select", "Cash", "Online"];

  // New: Device options
  const deviceOptions = ["Select", "Laptop", "PC"];

  return (
    // Attach the onClick handler to the outermost overlay div
    <div
      className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleOverlayClick} // This will now close the modal if clicked outside modalContentRef
    >
      <div
        ref={modalContentRef} // Attach ref to the actual modal content div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all sm:w-full sm:max-w-4xl animate-scale-up"
        // No need for stopPropagation here; the logic in handleOverlayClick handles it.
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Add New Lead</h2>
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
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Parents Name (combining First/Last for simplicity, or add separately if needed) */}
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
              value={formData.parentsName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., John & Jane Doe"
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
              value={formData.studentName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
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
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label
              htmlFor="contactWhatsapp"
              className="block text-sm font-medium text-gray-700"
            >
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="contactWhatsapp"
              name="contactWhatsapp"
              value={formData.contactWhatsapp}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={formData.ageGrade}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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
              value={formData.course}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {courseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
              value={formData.source}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Last Call */}
          <div>
            <label
              htmlFor="recentCall"
              className="block text-sm font-medium text-gray-700"
            >
              Last Call
            </label>
            <input
              type="date"
              id="recentCall"
              name="recentCall"
              value={formData.recentCall}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={formData.nextCall}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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
              value={formData.classType}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {classTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
              value={formData.value}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Adset Name */}
          <div>
            <label
              htmlFor="adsetName"
              className="block text-sm font-medium text-gray-700"
            >
              Adset Name
            </label>
            <input
              type="text"
              id="adsetName"
              name="adsetName"
              value={formData.adsetName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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
              value={formData.shift}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {shiftOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
              value={formData.courseType}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={formData.paymentType}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {paymentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="device"
              className="block text-sm font-medium text-gray-700"
            >
              Device
            </label>
            <select
              id="device"
              name="device"
              value={formData.device} // Now bound to formData.device
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {deviceOptions.map(
                (
                  option // Using new deviceOptions
                ) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Previous Coding Experience */}
          <div>
            <label
              htmlFor="previousCodingExp"
              className="block text-sm font-medium text-gray-700"
            >
              Previous Coding Experience
            </label>
            <input
              type="text"
              id="previousCodingExp"
              name="previousCodingExp"
              value={formData.previousCodingExp}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Basic Python, None"
            />
          </div>

          {/* Workshop Batch (if applicable) */}
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
              value={formData.workshopBatch}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Remarks (full width) */}
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
              value={formData.remarks}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          {/* Address Fields (as provided, can be grouped or simplified) */}
          <div className="md:col-span-3 text-lg font-semibold text-gray-800 border-t pt-4">
            Main Address
          </div>
          <div>
            <label
              htmlFor="addressLine1"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 1
            </label>
            <input
              type="text"
              id="addressLine1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="addressLine2"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 2
            </label>
            <input
              type="text"
              id="addressLine2"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={formData.county}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={formData.postCode}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Form Actions */}
          <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
