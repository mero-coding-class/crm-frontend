import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../config";
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
  // Controlled form defaults to avoid uncontrolled -> controlled warnings.
  // Keep a flat list of commonly-used fields so every input has a defined
  // initial value. We'll merge the normalized lead into this object when
  // `lead` prop is available.
  const DEFAULT_FORM = {
    _id: "",
    studentName: "",
    parentsName: "",
    email: "",
    phone: "",
    contactWhatsapp: "",
    age: "",
    grade: "",
    course: "",
    courseDuration: "",
    course_duration: "",
    source: "",
    addDate: "",
    recentCall: "",
    nextCall: "",
    status: "Active",
    substatus: "New", // Backend expects this field
    permanentAddress: "",
    temporaryAddress: "",
    city: "",
    county: "",
    postCode: "",
    classType: "",
    value: "",
    adsetName: "",
    remarks: "",
    shift: "",
    paymentType: "",
    device: "",
    previousCodingExp: "",
    workshopBatch: "",
    assigned_to: "",
    assigned_to_username: "",
  };

  const [formData, setFormData] = useState(DEFAULT_FORM);

  const { user, authToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;

    const normalized = {
      // assigned fields (normalize both variants)
      assigned_to: lead.assigned_to || lead.assigned_to_username || "",
      assigned_to_username: lead.assigned_to_username || lead.assigned_to || "",
      _id: lead._id || lead.id || String(lead.id || "") || `lead-${Date.now()}`,
      studentName: lead.studentName || lead.student_name || lead.student || "",
      parentsName:
        lead.parentsName || lead.parents_name || lead.parent_name || "",
      email: lead.email || lead.email || "",
      phone: lead.phone || lead.phone_number || lead.phone_number || "",
      contactWhatsapp:
        lead.contactWhatsapp ||
        lead.contact_whatsapp ||
        lead.whatsapp_number ||
        lead.whatsapp ||
        "",
      age: lead.age ?? "",
      grade: lead.grade || "",
      // Normalize course to the backend primary key (id) when possible.
      // If lead.course is an object or numeric id, prefer that. Otherwise try to
      // resolve from course_name using the supplied `courses` prop.
      course: (() => {
        if (lead.course && typeof lead.course === "object")
          return lead.course.id || lead.course;
        if (
          lead.course &&
          (typeof lead.course === "number" || /^\d+$/.test(String(lead.course)))
        )
          return lead.course;
        if (lead.course_name && Array.isArray(courses)) {
          const found = courses.find(
            (c) =>
              (c.course_name || c.name || "").toString().trim() ===
              String(lead.course_name).trim()
          );
          return found ? found.id : "";
        }
        return "";
      })(),
      source: lead.source || "",
      addDate:
        getFormattedDate(lead.addDate || lead.add_date || lead.created_at) ||
        "",
      recentCall: getFormattedDate(lead.recentCall || lead.last_call) || "",
      nextCall: getFormattedDate(lead.nextCall || lead.next_call) || "",
      status: lead.status || lead.state || "",
      // support both substatus naming variants and course duration
      substatus: lead.substatus || lead.sub_status || "",
      sub_status: lead.sub_status || lead.substatus || "",
      course_duration: lead.course_duration || lead.courseDuration || "",
      courseDuration: lead.courseDuration || lead.course_duration || "",
      permanentAddress: lead.permanentAddress || lead.address_line_1 || "",
      temporaryAddress: lead.temporaryAddress || lead.address_line_2 || "",
      city: lead.city || "",
      county: lead.county || "",
      postCode: lead.postCode || lead.post_code || "",
      classType: lead.classType || lead.class_type || "",
      value: lead.value || "",
      adsetName: lead.adsetName || lead.adset_name || "",
      remarks: lead.remarks || lead.change_log || lead.changeLog || "",
      shift: lead.shift || "",
      paymentType: lead.paymentType || lead.payment_type || "",
      device: lead.device || "",
      previousCodingExp:
        lead.previousCodingExp || lead.previous_coding_experience || "",
      workshopBatch: lead.workshopBatch || lead.workshop_batch || "",
    };

    // Enforce backend-level semantics: backend only accepts these top-level
    // statuses; anything else is a sub-status. If incoming status is not in
    // the allowed list, move it into substatus and set a safe default for
    // the top-level `status` so we never send invalid choices.
    const allowedTopStatuses = ["Active", "Converted", "Lost"];
    const incomingStatus = (normalized.status || "").toString();
    if (incomingStatus && !allowedTopStatuses.includes(incomingStatus)) {
      // If no explicit substatus was provided, move this value there.
      if (!normalized.substatus || normalized.substatus === "") {
        normalized.substatus = incomingStatus;
        normalized.sub_status = incomingStatus;
      }
      normalized.status = "Active"; // safe default recognized by backend
    } else {
      normalized.status = incomingStatus || "Active";
      // ensure substatus matches backend format and preserves current value
      normalized.substatus =
        lead.substatus || lead.sub_status || normalized.substatus || "New";
    }

    // Merge with DEFAULT_FORM so every key is defined and inputs stay controlled
    setFormData({ ...DEFAULT_FORM, ...normalized });
  }, [lead]);

  // If the lead being edited is updated elsewhere in the app (inline edit),
  // pick up that change and refresh the modal form so fields (like
  // substatus/course_duration) reflect the latest value.
  useEffect(() => {
    const onLeadUpdated = (e) => {
      try {
        const updated = e?.detail?.lead;
        if (!updated) return;
        const editedId = (lead && (lead._id || lead.id)) || formData._id;
        const updatedId = updated._id || updated.id;
        if (!editedId || !updatedId) return;
        if (String(editedId) !== String(updatedId)) return;

        // Build a normalized object similar to the lead->form mapping above
        const normalized = {
          assigned_to:
            updated.assigned_to || updated.assigned_to_username || "",
          assigned_to_username:
            updated.assigned_to_username || updated.assigned_to || "",
          _id:
            updated._id ||
            updated.id ||
            String(updated.id || "") ||
            `lead-${Date.now()}`,
          studentName:
            updated.studentName ||
            updated.student_name ||
            updated.student ||
            "",
          parentsName:
            updated.parentsName ||
            updated.parents_name ||
            updated.parent_name ||
            "",
          email: updated.email || "",
          phone:
            updated.phone || updated.phone_number || updated.phone_number || "",
          contactWhatsapp:
            updated.contactWhatsapp ||
            updated.contact_whatsapp ||
            updated.whatsapp_number ||
            updated.whatsapp ||
            "",
          age: updated.age ?? "",
          grade: updated.grade || "",
          course: (() => {
            if (updated.course && typeof updated.course === "object")
              return updated.course.id || updated.course;
            if (
              updated.course &&
              (typeof updated.course === "number" ||
                /^\d+$/.test(String(updated.course)))
            )
              return updated.course;
            if (updated.course_name && Array.isArray(courses)) {
              const found = courses.find(
                (c) =>
                  (c.course_name || c.name || "").toString().trim() ===
                  String(updated.course_name).trim()
              );
              return found ? found.id : "";
            }
            return "";
          })(),
          source: updated.source || "",
          addDate:
            getFormattedDate(
              updated.addDate || updated.add_date || updated.created_at
            ) || "",
          recentCall:
            getFormattedDate(updated.recentCall || updated.last_call) || "",
          nextCall:
            getFormattedDate(updated.nextCall || updated.next_call) || "",
          status: updated.status || updated.state || "",
          substatus:
            updated.substatus || updated.sub_status || formData.substatus || "",
          sub_status:
            updated.sub_status ||
            updated.substatus ||
            formData.sub_status ||
            "",
          course_duration:
            updated.course_duration ||
            updated.courseDuration ||
            formData.course_duration ||
            "",
          courseDuration:
            updated.courseDuration ||
            updated.course_duration ||
            formData.courseDuration ||
            "",
          permanentAddress:
            updated.permanentAddress || updated.address_line_1 || "",
          temporaryAddress:
            updated.temporaryAddress || updated.address_line_2 || "",
          city: updated.city || "",
          county: updated.county || "",
          postCode: updated.postCode || updated.post_code || "",
          classType: updated.classType || updated.class_type || "",
          value: updated.value || "",
          adsetName: updated.adsetName || updated.adset_name || "",
          remarks:
            updated.remarks || updated.change_log || updated.changeLog || "",
          shift: updated.shift || "",
          paymentType: updated.paymentType || updated.payment_type || "",
          device: updated.device || "",
          previousCodingExp:
            updated.previousCodingExp ||
            updated.previous_coding_experience ||
            "",
          workshopBatch: updated.workshopBatch || updated.workshop_batch || "",
        };

        // Preserve backend-level semantics as in the lead prop mapping
        const allowedTopStatuses = ["Active", "Converted", "Lost"];
        const incomingStatus = (normalized.status || "").toString();
        if (incomingStatus && !allowedTopStatuses.includes(incomingStatus)) {
          if (!normalized.substatus || normalized.substatus === "") {
            normalized.substatus = incomingStatus;
            normalized.sub_status = incomingStatus;
          }
          normalized.status = "Active";
        } else {
          normalized.status = incomingStatus || "Active";
          normalized.substatus = normalized.substatus || "New";
          normalized.sub_status =
            normalized.sub_status || normalized.substatus || "New";
        }

        setFormData((prev) => ({ ...DEFAULT_FORM, ...prev, ...normalized }));
      } catch (err) {
        // ignore
        console.warn("LeadEditModal: failed to apply crm:leadUpdated", err);
      }
    };

    window.addEventListener("crm:leadUpdated", onLeadUpdated);
    return () => window.removeEventListener("crm:leadUpdated", onLeadUpdated);
  }, [lead, courses, formData._id]);

  // Fetch users for the "Assigned To" dropdown if current user is admin/superadmin
  useEffect(() => {
    const role = (user?.role || "").toLowerCase();
    if (!authToken || !["admin", "superadmin"].includes(role)) return;

    let cancelled = false;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/users/`, {
          headers: { Authorization: `Token ${authToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        if (!cancelled) setUsers(list);
      } catch (e) {
        console.warn("LeadEditModal: could not fetch users", e);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [authToken, user]);

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
    // Send data in format expected by backend
    const updatedData = {
      ...formData,
      // Send only substatus (no underscore) as that's what backend expects
      substatus: formData.substatus || "New",
      // Remove sub_status to avoid confusion
      sub_status: undefined,
    };
    onSave(updatedData);
  };

  // Dropdown options
  // Status in the app is limited to these three; other states are kept in Sub Status
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
              type="text"
              id="age"
              name="age"
              value={formData.age || ""}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
                value={
                  formData.assigned_to || formData.assigned_to_username || ""
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assigned_to: e.target.value,
                    assigned_to_username: e.target.value,
                  }))
                }
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
