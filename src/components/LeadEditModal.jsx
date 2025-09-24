import React, { useState, useEffect, useRef } from "react";
import { PAYMENT_TYPE_OPTIONS } from "../constants/paymentOptions";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../config";
import { XMarkIcon } from "@heroicons/react/24/outline";
import LeadEditForm from "./LeadEditForm";

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
    add_date: "",
    recentCall: "",
    nextCall: "",
    status: "Active",
    substatus: "New", // Backend expects this field
    permanentAddress: "",
    temporaryAddress: "",
    city: "",
    county: "",
    postCode: "",
    class_type: "",
    course_type: "",
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
    // Backend fields the server expects
    school_college_name: "",
    lead_type: "",
    // New canonical field replacing legacy demo_scheduled
    scheduled_taken: "",
    // Legacy field kept only for backward read compatibility (do not write)
    demo_scheduled: "",
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
      add_date:
        getFormattedDate(lead.add_date || lead.addDate || lead.created_at) ||
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
      class_type: lead.class_type || lead.classType || "",
      course_type: lead.course_type || lead.courseType || "",
      value: lead.value || "",
      adsetName: lead.adsetName || lead.adset_name || "",
      remarks: lead.remarks || lead.change_log || lead.changeLog || "",
      shift: lead.shift || "",
      paymentType: lead.paymentType || lead.payment_type || "",
      device: lead.device || "",
      previousCodingExp:
        lead.previousCodingExp || lead.previous_coding_experience || "",
      // Map backend fields if present on the lead
      school_college_name:
        lead.school_college_name || lead.school || lead.school_college || "",
      lead_type: lead.lead_type || lead.leadType || "",
      // Prefer new scheduled_taken; fall back to legacy demo_scheduled
      scheduled_taken: lead.scheduled_taken || lead.demo_scheduled || "",
      demo_scheduled: lead.demo_scheduled || "", // retain for display only if backend still returns it
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
          add_date:
            getFormattedDate(
              updated.add_date || updated.addDate || updated.created_at
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
          class_type: updated.class_type || updated.classType || "",
          course_type: updated.course_type || updated.courseType || "",
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
          school_college_name:
            updated.school_college_name ||
            updated.school ||
            updated.school_college ||
            "",
          lead_type: updated.lead_type || updated.leadType || "",
          scheduled_taken:
            updated.scheduled_taken || updated.demo_scheduled || "",
          demo_scheduled: updated.demo_scheduled || "",
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
    setFormData((prevData) => {
      // Keep snake_case/camelCase variants in sync for fields like course_duration
      if (name === "courseDuration") {
        return { ...prevData, courseDuration: value, course_duration: value };
      }
      if (name === "course_duration") {
        return { ...prevData, course_duration: value, courseDuration: value };
      }
      if (name === "class_type" || name === "classType") {
        return { ...prevData, class_type: value };
      }
      if (name === "course_type" || name === "courseType") {
        return { ...prevData, course_type: value };
      }
      if (name === "scheduled_taken" || name === "demo_scheduled") {
        // Always store in scheduled_taken canonical field
        return { ...prevData, scheduled_taken: value, demo_scheduled: value };
      }
      return {
        ...prevData,
        [name]: value,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send data in format expected by backend
    const updatedData = {
      ...formData,
      // Send only substatus (no underscore) as that's what backend expects
      substatus: formData.substatus || "New",
      // Send the exact selected source label so it matches backend choices
      source:
        formData.source && formData.source !== "Select" ? formData.source : "",
      // Keep course_duration in payload. IMPORTANT: allow empty string to clear the field.
      course_duration:
        formData.courseDuration !== undefined &&
        formData.courseDuration !== null
          ? formData.courseDuration
          : formData.course_duration !== undefined &&
            formData.course_duration !== null
          ? formData.course_duration
          : "",
      // Remove sub_status to avoid confusion
      sub_status: undefined,
      // Ensure backend fields are present
      school_college_name: formData.school_college_name || "",
      lead_type: formData.lead_type || "",
      // Always send scheduled_taken; keep legacy demo_scheduled out of payload
      scheduled_taken:
        formData.scheduled_taken || formData.demo_scheduled || "",
      demo_scheduled: undefined,
      // Add new fields for backend
      class_type: formData.class_type,
      course_type: formData.course_type,
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
    "TikTok",
    "Instagram",
    "Other",
  ];
  // Class type: backend expects exactly "One to One" or "Group"
  const classTypeOptions = ["Select", "One to One", "Group"];
  // Course type: backend expects exactly "Physical" or "Online"
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
  const paymentTypeOptions = PAYMENT_TYPE_OPTIONS; // centralized list
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
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-4"
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <LeadEditForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          courses={courses}
          users={users}
          usersLoading={usersLoading}
          user={user}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default LeadEditModal;
