import React, { useState, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Helper function to get current date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AddLeadModal = ({ onClose, onSave, courses = [], authToken }) => {
  const [formData, setFormData] = useState({
    student_name: "",
    parents_name: "",
    email: "",
    phone_number: "",
    whatsapp_number: "",
    age: "",
    grade: "",
    source: "",
    course_name: "", // Changed from course to course_name
    class_type: "",
    shift: "",
    status: "New",
    previous_coding_experience: "",
    last_call: "",
    next_call: "",
    value: "",
    adset_name: "",
    remarks: "",
    payment_type: "",
    device: "",
    workshop_batch: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    county: "",
    post_code: "",
    add_date: getTodayDate(),
  });

  const modalContentRef = useRef(null);

  const handleOverlayClick = (event) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- 1️⃣ Required Fields Validation ---
    const requiredFields = ["student_name", "parents_name", "phone_number"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }

    // --- 2️⃣ Prepare Payload ---
    const payload = {
      ...formData,
      last_call: formData.last_call === "" ? null : formData.last_call,
      next_call: formData.next_call === "" ? null : formData.next_call,
      source: formData.source === "Select" ? "" : formData.source,
      class_type: formData.class_type === "Select" ? "" : formData.class_type,
      shift: formData.shift === "Select" ? "" : formData.shift,
      payment_type:
        formData.payment_type === "Select" ? "" : formData.payment_type,
      previous_coding_experience:
        formData.previous_coding_experience === "Select"
          ? ""
          : formData.previous_coding_experience,
      device: formData.device === "Select" ? "" : formData.device,
    };

    // Remove frontend-only fields
    delete payload._id;
    delete payload.invoice;

    // --- 3️⃣ Log Payload and Token ---
    console.log("Auth Token:", authToken);
    console.log("Payload to send:", payload);

    if (!authToken) {
      alert("Authentication token is missing! Please log in.");
      return;
    }

    // --- 4️⃣ API Call ---
    try {
      // Create a temporary ID for optimistic updates
      const tempId = `new-${Date.now()}`;

      // Transform the data to match backend's format and create the final lead object
      const backendPayload = {
        _id: tempId,
        student_name: formData.student_name.trim(),
        parents_name: formData.parents_name.trim(),
        email: formData.email,
        phone_number: formData.phone_number.trim(),
        whatsapp_number: formData.whatsapp_number.trim(),
        age: formData.age,
        grade: formData.grade,
        source: formData.source === "Select" ? "" : formData.source,
        class_type: formData.class_type === "Select" ? "" : formData.class_type,
        shift: formData.shift === "Select" ? "" : formData.shift,
        status: formData.status || "New",
        device: formData.device === "Select" ? "" : formData.device,
        previous_coding_experience:
          formData.previous_coding_experience === "Select"
            ? ""
            : formData.previous_coding_experience,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        county: formData.county,
        post_code: formData.post_code,
        value: formData.value,
        adset_name: formData.adset_name,
        remarks: formData.remarks,
        payment_type:
          formData.payment_type === "Select" ? "" : formData.payment_type,
        workshop_batch: formData.workshop_batch,
        course_name: formData.course_name,
        last_call: formData.last_call || null,
        next_call: formData.next_call || null,
        add_date: formData.add_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Call onSave with the optimistic data first
      onSave(backendPayload);

      // Close the modal immediately
      onClose();

      const response = await fetch(
        "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify(backendPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        alert(
          `Failed to add lead. Status ${response.status}: ${
            errorData.detail || "Unknown error"
          }`
        );
        return;
      }

      const result = await response.json();
      console.log("Lead added successfully:", result);

      // Update the lead data with the server response
      const serverLead = {
        ...backendPayload,
        _id: result.id.toString(),
        id: result.id,
        created_at: result.created_at,
        updated_at: result.updated_at,
      };

      // Update the lead in the parent component with the server data
      onSave({
        ...serverLead,
        logs_url: `https://crmmerocodingbackend.ktm.yetiappcloud.com/api/${result.id}/logs`,
      });

      console.log("Lead saved successfully:", serverLead);
    } catch (error) {
      console.error("Network Error:", error);
      alert(
        "An error occurred while connecting to the server. Please try again later."
      );
    }
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
  const deviceOptions = ["Select", "Yes", "No"];

  return (
    <div
      className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalContentRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all sm:w-full sm:max-w-4xl animate-scale-up"
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

          {/* Add Date - New Field */}
          <div>
            <label
              htmlFor="add_date"
              className="block text-sm font-medium text-gray-700"
            >
              Add Date
            </label>
            <input
              type="date"
              id="add_date"
              name="add_date"
              value={formData.add_date}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="created_by"
              className="block text-sm font-medium text-gray-700"
            >
              Assigned To
            </label>
            <input
              type="text"
              id="created_by"
              name="created_by"
              value={formData.created_by || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Optional"
            />
          </div>

          {/* Parents Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="parents_name"
              className="block text-sm font-medium text-gray-700"
            >
              Parents' Name
            </label>
            <input
              type="text"
              id="parents_name"
              name="parents_name"
              value={formData.parents_name}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., John & Jane Doe"
              required // Added 'required' attribute
            />
          </div>

          {/* Student Name */}
          <div>
            <label
              htmlFor="student_name"
              className="block text-sm font-medium text-gray-700"
            >
              Student Name
            </label>
            <input
              type="text"
              id="student_name"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required // Added 'required' attribute
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
              required // Added 'required' attribute
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required // Added 'required' attribute
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label
              htmlFor="whatsapp_number"
              className="block text-sm font-medium text-gray-700"
            >
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="whatsapp_number"
              name="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required // Added 'required' attribute
            />
          </div>

          {/* Age */}
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700"
            >
              Age
            </label>
            <input
              type="text"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Grade */}
          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700"
            >
              Grade
            </label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Course Name - Dynamically loaded from courses prop */}
          <div>
            <label
              htmlFor="course_name"
              className="block text-sm font-medium text-gray-700"
            >
              Course
            </label>
            <select
              id="course_name"
              name="course_name"
              value={formData.course_name}
              onChange={handleChange}
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
          {/* Course Duration - Now a text field */}
          <div>
            <label
              htmlFor="course_duration"
              className="block text-sm font-medium text-gray-700"
            >
              Course Duration (hours)
            </label>
            <input
              type="text"
              id="course_duration"
              name="course_duration"
              value={formData.course_duration}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={formData.source}
              onChange={handleChange}
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
          <div>
            <label
              htmlFor="last_call"
              className="block text-sm font-medium text-gray-700"
            >
              Last Call
            </label>
            <input
              type="date"
              id="last_call"
              name="last_call"
              value={formData.last_call || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Next Call */}
          <div>
            <label
              htmlFor="next_call"
              className="block text-sm font-medium text-gray-700"
            >
              Next Call
            </label>
            <input
              type="date"
              id="next_call"
              name="next_call"
              value={formData.next_call || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Class Type */}
          <div>
            <label
              htmlFor="class_type"
              className="block text-sm font-medium text-gray-700"
            >
              Class Type
            </label>
            <select
              id="class_type"
              name="class_type"
              value={formData.class_type}
              onChange={handleChange}
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
              htmlFor="adset_name"
              className="block text-sm font-medium text-gray-700"
            >
              Adset Name
            </label>
            <input
              type="text"
              id="adset_name"
              name="adset_name"
              value={formData.adset_name}
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
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label
              htmlFor="payment_type"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Type
            </label>
            <select
              id="payment_type"
              name="payment_type"
              value={formData.payment_type}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {paymentTypeOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
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
              value={formData.device}
              onChange={handleChange}
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
          <div>
            <label
              htmlFor="previous_coding_experience"
              className="block text-sm font-medium text-gray-700"
            >
              Previous Coding Experience
            </label>
            <select
              id="previous_coding_experience"
              name="previous_coding_experience"
              value={formData.previous_coding_experience}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {previousCodingExpOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Workshop Batch (if applicable) */}
          <div>
            <label
              htmlFor="workshop_batch"
              className="block text-sm font-medium text-gray-700"
            >
              School/College
            </label>
            <input
              type="text"
              id="workshop_batch"
              name="workshop_batch"
              value={formData.workshop_batch}
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

          {/* Address Fields */}
          <div className="md:col-span-3 text-lg font-semibold text-gray-800 border-t pt-4">
            Main Address
          </div>
          <div>
            <label
              htmlFor="address_line_1"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 1 (Permanent)
            </label>
            <input
              type="text"
              id="address_line_1"
              name="address_line_1"
              value={formData.address_line_1}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="address_line_2"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 2 (Temporary)
            </label>
            <input
              type="text"
              id="address_line_2"
              name="address_line_2"
              value={formData.address_line_2}
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
              htmlFor="post_code"
              className="block text-sm font-medium text-gray-700"
            >
              Post Code
            </label>
            <input
              type="text"
              id="post_code"
              name="post_code"
              value={formData.post_code}
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
