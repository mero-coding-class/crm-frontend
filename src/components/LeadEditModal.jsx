import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Helper function to safely format a date string into YYYY-MM-DD format,
// which is required for input type="date".
const getFormattedDate = (dateString) => {
  try {
    if (!dateString || dateString === "N/A") return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(
        "LeadEditModal: Invalid date string received for date input (will be empty):",
        dateString
      );
      return "";
    }
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error(
      "Error formatting date in LeadEditModal:",
      error,
      "Original string:",
      dateString
    );
    return "";
  }
};

const LeadEditModal = ({ lead, onClose, onSave, courses }) => {
  // Initialize formData with the lead data, ensuring all fields are present
  const [formData, setFormData] = useState({
    _id: lead._id,
    studentName: lead.studentName || "",
    parentsName: lead.parentsName || "",
    email: lead.email || "",
    phone: lead.phone || "",
    contactWhatsapp: lead.contactWhatsapp || "",
    age: lead.age || "",
    grade: lead.grade || "",
    course: lead.course || "", // Assuming course holds the course_name string
    source: lead.source || "",
    addDate: getFormattedDate(lead.addDate) || "", // Ensure addDate is formatted
    recentCall: getFormattedDate(lead.recentCall) || "",
    nextCall: getFormattedDate(lead.nextCall) || "",
    status: lead.status || "New",
    permanentAddress: lead.permanentAddress || "",
    temporaryAddress: lead.temporaryAddress || "",
    city: lead.city || "",
    county: lead.county || "",
    postCode: lead.postCode || "",
    classType: lead.classType || "",
    value: lead.value || "",
    adsetName: lead.adsetName || "",
    remarks: lead.remarks || "",
    shift: lead.shift || "",
    paymentType: lead.paymentType || "",
    device: lead.device || "",
    previousCodingExp: lead.previousCodingExp || "",
    workshopBatch: lead.workshopBatch || "",
  });

  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleOverlayClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
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

  // Dropdown options
  const statusOptions = [
    "New",
    "Open",
    "Average",
    "Followup",
    "Interested",
    "inProgress",
    "Active",
    "Converted",
    "Lost",
    "Junk",
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
    "5 P.M. - 7 P.M.",
    "6 P.M. - 7 P.M.",
    "6 P.M. - 8 P.M.",
    "7 P.M. - 8 P.M.",
  ];
  const paymentTypeOptions = [
    "Select",
    "Cash",
    "Online",
    "Bank Transfer",
    "Cheque",
  ];
  const deviceOptions = ["Select", "Yes", "No"];
  const previousCodingExpOptions = [
    "Select",
    "None",
    "Basic Python",
    "Intermediate C++",
    "Arduino",
    "Some Linux",
    "Advanced Python",
    "Basic Java",
    "Other",
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        // Increased max-w for better horizontal space, adjusted max-h and overflow for scrollability
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto transform transition-all animate-scale-up"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">
            Edit Lead: {formData.studentName || "N/A"}
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
          className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Read-only ID and Add Date - Grouped for consistency */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead ID
            </label>
            <input
              type="text"
              name="_id"
              value={formData._id}
              className="p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-sm"
              readOnly
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Date
            </label>
            <input
              type="date"
              name="addDate"
              value={formData.addDate}
              className="p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-sm"
              readOnly
            />
          </div>

          {/* Student Name */}
          <div className="flex flex-col">
            <label
              htmlFor="studentName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Student Name
            </label>
            <input
              type="text"
              id="studentName"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          {/* Parents' Name */}
          <div className="flex flex-col">
            <label
              htmlFor="parentsName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Parents' Name
            </label>
            <input
              type="text"
              id="parentsName"
              name="parentsName"
              value={formData.parentsName}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., John & Jane Doe"
            />
          </div>
          {/* Email */}
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          {/* Phone Number */}
          <div className="flex flex-col">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* WhatsApp Number */}
          <div className="flex flex-col">
            <label
              htmlFor="contactWhatsapp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="contactWhatsapp"
              name="contactWhatsapp"
              value={formData.contactWhatsapp}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Age */}
          <div className="flex flex-col">
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Grade */}
          <div className="flex flex-col">
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Grade
            </label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Course - Dynamically loaded from courses prop */}
          <div className="flex flex-col">
            <label
              htmlFor="course"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Course
            </label>
            <select
              id="course"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.course_name}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>
          {/* Source */}
          <div className="flex flex-col">
            <label
              htmlFor="source"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Source
            </label>
            <select
              id="source"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {sourceOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {/* Last Call */}
          <div className="flex flex-col">
            <label
              htmlFor="recentCall"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Call
            </label>
            <input
              type="date"
              id="recentCall"
              name="recentCall"
              value={formData.recentCall}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Next Call */}
          <div className="flex flex-col">
            <label
              htmlFor="nextCall"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Next Call
            </label>
            <input
              type="date"
              id="nextCall"
              name="nextCall"
              value={formData.nextCall}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Class Type */}
          <div className="flex flex-col">
            <label
              htmlFor="classType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Class Type
            </label>
            <select
              id="classType"
              name="classType"
              value={formData.classType}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {classTypeOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {/* Value */}
          <div className="flex flex-col">
            <label
              htmlFor="value"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Value
            </label>
            <input
              type="text"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Adset Name */}
          <div className="flex flex-col">
            <label
              htmlFor="adsetName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Adset Name
            </label>
            <input
              type="text"
              id="adsetName"
              name="adsetName"
              value={formData.adsetName}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Shift */}
          <div className="flex flex-col">
            <label
              htmlFor="shift"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Shift
            </label>
            <select
              id="shift"
              name="shift"
              value={formData.shift}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {shiftOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {/* Payment Type */}
          <div className="flex flex-col">
            <label
              htmlFor="paymentType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Payment Type
            </label>
            <select
              id="paymentType"
              name="paymentType"
              value={formData.paymentType}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {paymentTypeOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {/* Device */}
          <div className="flex flex-col">
            <label
              htmlFor="device"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Device
            </label>
            <select
              id="device"
              name="device"
              value={formData.device}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {deviceOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {/* Previous Coding Experience */}
          <div className="flex flex-col">
            <label
              htmlFor="previousCodingExp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Previous Coding Experience
            </label>
            <select
              id="previousCodingExp"
              name="previousCodingExp"
              value={formData.previousCodingExp}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {previousCodingExpOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {/* Workshop Batch */}
          <div className="flex flex-col">
            <label
              htmlFor="workshopBatch"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Workshop Batch
            </label>
            <input
              type="text"
              id="workshopBatch"
              name="workshopBatch"
              value={formData.workshopBatch}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Address Fields Section Header */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-lg font-semibold text-gray-800 border-t pt-4 mt-2">
            Main Address
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="permanentAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address Line 1 (Permanent)
            </label>
            <input
              type="text"
              id="permanentAddress"
              name="permanentAddress"
              value={formData.permanentAddress}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="temporaryAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address Line 2 (Temporary)
            </label>
            <input
              type="text"
              id="temporaryAddress"
              name="temporaryAddress"
              value={formData.temporaryAddress}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="county"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              County
            </label>
            <input
              type="text"
              id="county"
              name="county"
              value={formData.county}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="postCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Post Code
            </label>
            <input
              type="text"
              id="postCode"
              name="postCode"
              value={formData.postCode}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Status and Remarks - Made full width on mobile/tablet, consistent on larger screens */}
          <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows="3"
              value={formData.remarks || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end gap-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-md text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
