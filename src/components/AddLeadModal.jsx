import React, { useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PAYMENT_TYPE_OPTIONS } from "../constants/paymentOptions";
import {
  statusOptions,
  subStatusOptions,
} from "../constants/leadStatusOptions";
import {
  sourceOptions,
  classTypeOptions,
  deviceOptions,
  previousCodingExpOptions,
  courseTypeOptions,
} from "../constants/addLeadOptions";
import useAddLeadForm from "./addLead/useAddLeadForm";
import {
  FieldError as FieldErrorBase,
  RequiredLabel as RequiredLabelBase,
} from "./addLead/helpers.jsx";
import useUsers from "../pages/leads/useUsers";
import AssignedToSelect from "./addLead/AssignedToSelect";
import AddressFields from "./addLead/AddressFields";
import PaymentSection from "./addLead/PaymentSection";

const AddLeadModal = ({ onClose, onSave, courses = [], authToken }) => {
  const { user } = useAuth();
  const isAdmin =
    user &&
    (user.role === "admin" ||
      user.role === "super admin" ||
      user.role === "superadmin" ||
      user.role === "super-admin");
  const { formData, setField, errors, setErrors, handleSubmit } =
    useAddLeadForm({
      courses,
      authToken,
      onClose,
      onSave,
      isAdmin,
    });
  const modalContentRef = useRef(null);
  const { users, usersLoading } = useUsers(authToken);

  // Refs to required fields to focus when validation fails
  const fieldRefs = useRef({});
  const setFieldRef = (name) => (el) => {
    if (el) fieldRefs.current[name] = el;
  };

  const handleOverlayClick = (event) => {
    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(event.target)
    ) {
      // Only close if there are no current validation errors
      if (!errors || Object.keys(errors).length === 0) onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await handleSubmit();
    if (res && res.ok === false && res.reason === "validation") {
      const first = res.first;
      const ref = first ? fieldRefs.current[first] : null;
      if (ref && typeof ref.focus === "function") {
        try {
          ref.focus();
          // Scroll into view for better UX
          ref.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {}
      }
      // Do not close modal; show errors inline via FieldError components
      return;
    }
  };

  const paymentTypeOptions = PAYMENT_TYPE_OPTIONS; // centralized constant
  // Defensive: ensure `courses` is an array before using .map
  const warnedCoursesShape = useRef(false);
  const coursesList = Array.isArray(courses) ? courses : [];
  if (!Array.isArray(courses) && !warnedCoursesShape.current) {
    console.warn(
      "AddLeadModal expected `courses` to be an array but received:",
      courses
    );
    warnedCoursesShape.current = true;
  }

  // Fields the user marked as optional — do NOT show the required star for these
  const optionalFields = new Set([
    "shift",
    "previous_coding_experience",
    "last_call",
    "next_call",
    "value",
    "adset_name",
    "course_duration",
    "payment_type",
    "device",
    "school_college_name",
    "remarks",
    "address_line_1",
    "address_line_2",
    "city",
    "county",
    "post_code",
    "created_by",
    "demo_scheduled",
    // server-managed timestamps are optional on the form
    "created_at",
    "updated_at",
  ]);

  // Small component to render inline field errors
  const FieldError = ({ name }) => (
    <FieldErrorBase name={name} errors={errors} />
  );
  const RequiredLabel = ({ field, children }) => (
    <RequiredLabelBase field={field} optionalFields={optionalFields}>
      {children}
    </RequiredLabelBase>
  );

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
          onSubmit={onSubmit}
          className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* (optional fields legend removed) */}
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

          {/* Sub Status */}
          <div>
            <label
              htmlFor="sub_status"
              className="block text-sm font-medium text-gray-700"
            >
              Sub Status
            </label>
            <select
              id="sub_status"
              name="sub_status"
              value={formData.sub_status}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {subStatusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Type */}
          <div>
            <label
              htmlFor="lead_type"
              className="block text-sm font-medium text-gray-700"
            >
              <RequiredLabel field="lead_type">Lead Type</RequiredLabel>
            </label>
            <select
              id="lead_type"
              name="lead_type"
              value={formData.lead_type}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              ref={setFieldRef("lead_type")}
            >
              <option value="">Select type</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
            <FieldError name="lead_type" />
          </div>

          {/* Demo Scheduled */}
          <div>
            <label
              htmlFor="demo_scheduled"
              className="block text-sm font-medium text-gray-700"
            >
              Demo Scheduled
            </label>
            <select
              id="demo_scheduled"
              name="demo_scheduled"
              value={formData.demo_scheduled}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Add Date - New Field */}
          <div>
            <label
              htmlFor="add_date"
              className="block text-sm font-medium text-gray-700"
            >
              <RequiredLabel field="add_date">Add Date</RequiredLabel>
            </label>
            <input
              type="date"
              id="add_date"
              name="add_date"
              value={formData.add_date}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ref={setFieldRef("add_date")}
            />
            <FieldError name="add_date" />
          </div>
          <AssignedToSelect
            isAdmin={isAdmin}
            users={users}
            usersLoading={usersLoading}
            value={formData.created_by || ""}
            onChange={handleChange}
            RequiredLabel={RequiredLabel}
          />

          {/* Parents Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="parents_name"
              className="block text-sm font-medium text-gray-700"
            >
              <RequiredLabel field="parents_name">Parents' Name</RequiredLabel>
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
              ref={setFieldRef("parents_name")}
            />
            <FieldError name="parents_name" />
          </div>

          {/* Student Name */}
          <div>
            <label
              htmlFor="student_name"
              className="block text-sm font-medium text-gray-700"
            >
              <RequiredLabel field="student_name">Student Name</RequiredLabel>
            </label>
            <input
              type="text"
              id="student_name"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required // Added 'required' attribute
              ref={setFieldRef("student_name")}
            />
            <FieldError name="student_name" />

            {/* School/College Name */}
            <div className="md:col-span-1">
              <label
                htmlFor="school_college_name"
                className="block text-sm font-medium text-gray-700"
              >
                <RequiredLabel field="school_college_name">
                  School / College Name
                </RequiredLabel>
              </label>
              <input
                type="text"
                id="school_college_name"
                name="school_college_name"
                value={formData.school_college_name}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional"
              />
              <FieldError name="school_college_name" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              <RequiredLabel field="email">Email</RequiredLabel>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required // Added 'required' attribute
              ref={setFieldRef("email")}
            />
            <FieldError name="email" />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700"
            >
              <RequiredLabel field="phone_number">Phone Number</RequiredLabel>
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required // Added 'required' attribute
              ref={setFieldRef("phone_number")}
            />
            <FieldError name="phone_number" />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label
              htmlFor="whatsapp_number"
              className="block text-sm font-medium text-gray-700"
            >
              <RequiredLabel field="whatsapp_number">
                WhatsApp Number
              </RequiredLabel>
            </label>
            <input
              type="tel"
              id="whatsapp_number"
              name="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required // Added 'required' attribute
              ref={setFieldRef("whatsapp_number")}
            />
            <FieldError name="whatsapp_number" />
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
              <RequiredLabel field="course_name">Course</RequiredLabel>
            </label>
            <select
              id="course_name"
              name="course_name"
              value={formData.course_name}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ref={setFieldRef("course_name")}
            >
              <option value="">Select a course</option>
              {coursesList.map((course) => {
                const label =
                  course.course_name ||
                  course.name ||
                  course.title ||
                  String(course.id || "");
                const value = course.id ?? label;
                const key = course.id ?? label;
                return (
                  <option key={key} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
            <FieldError name="course_name" />
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
              <RequiredLabel field="source">Source</RequiredLabel>
            </label>
            <select
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ref={setFieldRef("source")}
            >
              {sourceOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError name="source" />
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
              <RequiredLabel field="class_type">Class Type</RequiredLabel>
            </label>
            <select
              id="class_type"
              name="class_type"
              value={formData.class_type}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ref={setFieldRef("class_type")}
            >
              {classTypeOptions.map((option) => (
                <option key={option} value={option === "Select" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError name="class_type" />
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

          {/* Shift (free text) */}
          <div>
            <label
              htmlFor="shift"
              className="block text-sm font-medium text-gray-700"
            >
              Shift
            </label>
            <input
              type="text"
              id="shift"
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              placeholder="e.g. 6 P.M. - 8 P.M. or Evening"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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

          {/* (Duplicate Workshop/School field removed - use `school_college_name` above) */}

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

          <AddressFields formData={formData} onChange={handleChange} />

          <PaymentSection formData={formData} setField={setField} />

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
