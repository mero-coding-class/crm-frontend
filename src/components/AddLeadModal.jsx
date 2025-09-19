import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../config";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Helper function to get current date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date from 'YYYY-MM-DD' to 'YYYY|DD|MM' for backend compatibility
const formatDateForBackend = (d) => {
  if (!d) return null;
  // already in expected shape? accept if contains '|'
  if (String(d).includes("|")) return d;
  const parts = String(d).split("-");
  if (parts.length !== 3) return d; // return as-is if unexpected format
  const [yyyy, mm, dd] = parts;
  return `${yyyy}|${dd}|${mm}`;
};

const AddLeadModal = ({ onClose, onSave, courses = [], authToken }) => {
  // Debug: log courses prop to help diagnose missing course_name in dropdown
  React.useEffect(() => {
    try {
      console.debug("AddLeadModal: courses prop:", courses);
      console.debug(
        "AddLeadModal: coursesList length:",
        Array.isArray(courses) ? courses.length : 0
      );
    } catch (e) {
      // ignore
    }
  }, [courses]);
  const [formData, setFormData] = useState({
    student_name: "",
    parents_name: "",
    email: "",
    phone_number: "",
    whatsapp_number: "",
    age: "",
    grade: "",
    source: "",
    course_name: "",
    course_duration: "",
    class_type: "",
    shift: "",
    status: "Active",
    sub_status: "New",
    school_college_name: "",
    lead_type: "",
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
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  useEffect(() => {
    // Fetch users for the Assigned To dropdown when authToken is available
    const fetchUsers = async () => {
      if (!authToken) return;
      setUsersLoading(true);
      setUsersError(null);
      try {
        const res = await fetch(`${BASE_URL}/users/`, {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to fetch users: ${res.status} ${err}`);
        }
        const data = await res.json();
        // Support both direct array and paginated { results: [] }
        const list = Array.isArray(data) ? data : data.results || [];
        setUsers(list);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsersError(err.message || String(err));
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [authToken]);

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

    const requiredFields = [
      "student_name",
      "parents_name",
      "phone_number",
      "lead_type",
    ];
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
      // Find selected course by id (value stored in select) so we can send the
      // numeric id to backend. The select now stores course.id as value.
      const selectedCourse = courses.find(
        (c) =>
          String(c.id) === String(formData.course_name) ||
          String(c.id) === String(formData.course)
      );
      const selectedCourseId = selectedCourse ? selectedCourse.id : null;

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
        substatus: formData.sub_status || "New",
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
        // Lead type (B2B / B2C)
        lead_type: formData.lead_type,
        school_college_name: formData.school_college_name || "",
        // Important: send course id under `course` so backend links correctly
        course: selectedCourseId,
        // Keep course_name for optimistic UI only (resolve from selectedCourse if possible)
        course_name: selectedCourse?.course_name ?? formData.course_name,
        course_duration: formData.course_duration,
        last_call: formatDateForBackend(formData.last_call),
        next_call: formatDateForBackend(formData.next_call),
        add_date: formData.add_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Only include assigned_to when the creator is an admin and a value was provided
      if (
        isAdmin &&
        formData.created_by &&
        String(formData.created_by).trim() !== ""
      ) {
        backendPayload.assigned_to = String(formData.created_by).trim();
      }

      // Call onSave with the optimistic data first
      onSave(backendPayload);

      // Close the modal immediately
      onClose();

      const response = await fetch(`${BASE_URL}/leads/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`,
        },
        body: JSON.stringify(backendPayload),
      });

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

      // Build server-side lead object using server response where possible
      const serverLead = {
        ...backendPayload,
        _id: result.id.toString(),
        id: result.id,
        created_at: result.created_at || backendPayload.created_at,
        updated_at: result.updated_at || backendPayload.updated_at,
        // Prefer server-provided names/ids; fall back to selectedCourse or form value
        course_name:
          result.course_name ??
          selectedCourse?.course_name ??
          formData.course_name,
        course: result.course ?? selectedCourseId ?? null,
        // Ensure front-end consumers can read both variants and course duration
        substatus:
          result.substatus ?? result.sub_status ?? backendPayload.substatus,
        sub_status:
          result.sub_status ?? result.substatus ?? backendPayload.sub_status,
        course_duration:
          result.course_duration ??
          backendPayload.course_duration ??
          formData.course_duration,
      };

      // Update the lead in the parent component with the server data
      onSave({
        ...serverLead,
        logs_url: `${BASE_URL}/leads/${result.id}/logs/`,
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
  const statusOptions = ["Active", "Converted", "Lost"];
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

  const subStatusOptions = [
    "New",
    "Open",
    "Followup",
    "inProgress",
    "Average",
    "Interested",
    "Junk",
  ];

  const { user } = useAuth();

  const isAdmin =
    user &&
    (user.role === "admin" ||
      user.role === "super admin" ||
      user.role === "superadmin" ||
      user.role === "super-admin");

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
  ]);

  const RequiredLabel = ({ field, children }) => (
    <>
      {children}
      {!optionalFields.has(field) && (
        <span className="text-red-600 ml-1" aria-hidden>
          *
        </span>
      )}
    </>
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
              Lead Type
            </label>
            <select
              id="lead_type"
              name="lead_type"
              value={formData.lead_type}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">Select type</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
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
          {isAdmin && (
            <div>
              <label
                htmlFor="created_by"
                className="block text-sm font-medium text-gray-700"
              >
                Assigned To
              </label>
              {usersLoading ? (
                <div className="mt-1 p-2">Loading users...</div>
              ) : usersError ? (
                <div className="mt-1 p-2 text-sm text-red-600">
                  Error loading users
                </div>
              ) : (
                <select
                  id="created_by"
                  name="created_by"
                  value={formData.created_by || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">(Unassigned)</option>
                  {users.map((u) => {
                    // prefer username but fall back to id if username not present
                    const label =
                      u.username || u.name || u.email || String(u.id);
                    const value = u.username || String(u.id);
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

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

            {/* School/College Name */}
            <div className="md:col-span-1">
              <label
                htmlFor="school_college_name"
                className="block text-sm font-medium text-gray-700"
              >
                School / College Name
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
            </div>
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
