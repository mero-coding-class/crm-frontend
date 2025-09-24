import React from "react";
import { PAYMENT_TYPE_OPTIONS } from "../constants/paymentOptions";

const LeadEditForm = ({
  formData,
  onChange,
  onSubmit,
  courses = [],
  users = [],
  usersLoading = false,
  user = {},
  onClose,
}) => {
  const statusOptions = ["Active", "Converted", "Lost"];
  const sourceOptions = [
    "Select",
    "WhatsApp/Viber",
    "Facebook",
    "Website",
    "Email",
    "Office Visit",
    "Direct call",
    "TikTok",
    "Instagram",
    "Other",
  ];
  const classTypeOptions = ["Select", "One to One", "Group"];
  const courseTypeOptions = ["Select", "Physical", "Online"];
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
  // Centralized payment type options (kept in src/constants/paymentOptions.js)
  const paymentTypeOptions = PAYMENT_TYPE_OPTIONS;
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
    <form
      onSubmit={onSubmit}
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
          Created Date
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      {/* The rest of the fields follow the same structure as before - keep names consistent with the parent */}
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* School / College Name (backend: school_college_name) */}
      <div className="flex flex-col">
        <label
          htmlFor="school_college_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          School / College Name
        </label>
        <input
          type="text"
          id="school_college_name"
          name="school_college_name"
          value={formData.school_college_name || ""}
          onChange={onChange}
          placeholder="e.g., Pawan Prakriti"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Lead Type (backend: lead_type) */}
      <div className="flex flex-col">
        <label
          htmlFor="lead_type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Lead Type
        </label>
        <select
          id="lead_type"
          name="lead_type"
          value={formData.lead_type || ""}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Select</option>
          <option value="B2B">B2B</option>
          <option value="B2C">B2C</option>
        </select>
      </div>

      {/* Scheduled Taken (replaces legacy Demo Scheduled) */}
      <div className="flex flex-col">
        <label
          htmlFor="scheduled_taken"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Scheduled Taken
        </label>
        <select
          id="scheduled_taken"
          name="scheduled_taken"
          value={formData.scheduled_taken || formData.demo_scheduled || ""}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
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
          type="text"
          id="age"
          name="age"
          value={formData.age || ""}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Sub Status */}
      <div className="flex flex-col">
        <label
          htmlFor="substatus"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Sub Status
        </label>
        <select
          id="substatus"
          name="substatus"
          value={formData.substatus || "New"}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {[
            "New",
            "Open",
            "Followup",
            "inProgress",
            "Average",
            "Interested",
            "Junk",
            "NextBatch",
          ].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Course */}
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={String(course.id)}>
              {course.course_name}
            </option>
          ))}
        </select>
      </div>

      {/* Course Duration */}
      <div className="flex flex-col">
        <label
          htmlFor="courseDuration"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Course Duration
        </label>
        <input
          type="text"
          id="courseDuration"
          name="courseDuration"
          value={formData.courseDuration || formData.course_duration || ""}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Assigned To (visible only to admin/superadmin) */}
      {((user?.role || "").toString().toLowerCase() === "admin" ||
        (user?.role || "").toString().toLowerCase() === "superadmin") && (
        <div className="flex flex-col">
          <label
            htmlFor="assignedTo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assigned To
          </label>
          <select
            id="assignedTo"
            name="assigned_to"
            value={formData.assigned_to || formData.assigned_to_username || ""}
            onChange={(e) => onChange(e)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option
                key={u.id || u.username}
                value={u.username || String(u.id)}
              >
                {u.username || u.email || String(u.id)}
              </option>
            ))}
          </select>
        </div>
      )}

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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Class Type */}
      <div className="flex flex-col">
        <label
          htmlFor="class_type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Class Type
        </label>
        <select
          id="class_type"
          name="class_type"
          value={formData.class_type}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {classTypeOptions.map((option) => (
            <option key={option} value={option === "Select" ? "" : option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="course_type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Course Type
        </label>
        <select
          id="course_type"
          name="course_type"
          value={formData.course_type}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {courseTypeOptions.map((option) => (
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
          onChange={onChange}
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Shift (free text) */}
      <div className="flex flex-col">
        <label
          htmlFor="shift"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Shift
        </label>
        <input
          type="text"
          id="shift"
          name="shift"
          value={formData.shift || ""}
          onChange={onChange}
          placeholder="e.g. Morning / Evening / 6pm-8pm"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {previousCodingExpOptions.map((option) => (
            <option key={option} value={option === "Select" ? "" : option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Workshop Batch removed - not used in UI */}

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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Status and Remarks */}
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
          onChange={onChange}
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
          onChange={onChange}
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
  );
};

export default LeadEditForm;
