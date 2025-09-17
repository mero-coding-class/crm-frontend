import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";
import { BASE_URL } from "../config";

const EnrolledStudentEditModal = ({ student, onClose, onSave }) => {
  const { authToken } = useAuth();
  // store full course objects (id, course_name, ...)
  const [courseOptions, setCourseOptions] = useState([]);
  const [formData, setFormData] = useState({
    ...student,
    // Keep existing enrollment-level fields
    student_name: student?.student_name || "",
    parents_name: student?.parents_name || "",
    email: student?.email || "",
    phone_number: student?.phone_number || "",
    course_name: student?.course_name || "",
    batch_name: student?.batch_name || "",
    assigned_teacher: student?.assigned_teacher || "",
    course_duration: student?.course_duration || "",
    starting_date: student?.starting_date || "",
    total_payment: student?.total_payment ?? "",
    first_installment: student?.first_installment ?? "",
    second_installment: student?.second_installment ?? "",
    third_installment: student?.third_installment ?? "",
    last_pay_date: student?.last_pay_date || "",
    payment_completed: student?.payment_completed,
    // ensure invoice entries have file/previewUrl for consistent editing
    invoice: (student?.invoice || []).map((inv) => ({
      ...inv,
      file: null,
      previewUrl: inv?.url || "",
    })),
    // align created/updated with backend
    created_at: student?.created_at || student?.enrollment_created_at || "",
    updated_at: student?.updated_at || student?.enrollment_updated_at || "",
    remarks: student?.remarks || "",
    // Nested lead object - ensure default structure exists for editing
    lead: {
      ...(student?.lead || student || {}),
      student_name:
        (student?.lead && student.lead.student_name) ||
        student?.student_name ||
        "",
      parents_name:
        (student?.lead && student.lead.parents_name) ||
        student?.parents_name ||
        "",
      email: (student?.lead && student.lead.email) || student?.email || "",
      phone_number: (student?.lead && student.lead.phone_number) || "",
      whatsapp_number: (student?.lead && student.lead.whatsapp_number) || "",
      age: (student?.lead && student.lead.age) || "",
      grade: (student?.lead && student.lead.grade) || "",
      status: (student?.lead && student.lead.status) || "",
      substatus: (student?.lead && student.lead.substatus) || "",
      add_date: (student?.lead && student.lead.add_date) || "",
      school_college_name:
        (student?.lead && student.lead.school_college_name) || "",
      lead_type: (student?.lead && student.lead.lead_type) || "",
      source: (student?.lead && student.lead.source) || "",
      class_type: (student?.lead && student.lead.class_type) || "",
      shift: (student?.lead && student.lead.shift) || "",
      previous_coding_experience:
        (student?.lead && student.lead.previous_coding_experience) || "",
      last_call: (student?.lead && student.lead.last_call) || "",
      next_call: (student?.lead && student.lead.next_call) || "",
      value: (student?.lead && student.lead.value) || "",
      adset_name: (student?.lead && student.lead.adset_name) || "",
      course_duration: (student?.lead && student.lead.course_duration) || "",
      payment_type: (student?.lead && student.lead.payment_type) || "",
      device: (student?.lead && student.lead.device) || "",
      address_line_1: (student?.lead && student.lead.address_line_1) || "",
      address_line_2: (student?.lead && student.lead.address_line_2) || "",
      city: (student?.lead && student.lead.city) || "",
      county: (student?.lead && student.lead.county) || "",
      post_code: (student?.lead && student.lead.post_code) || "",
      demo_scheduled: (student?.lead && student.lead.demo_scheduled) || "",
    },
  });

  const modalRef = useRef(null);
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${BASE_URL}/courses/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        // keep full objects so we can resolve id -> name if needed
        setCourseOptions(data || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };

    if (authToken) fetchCourses();
  }, [authToken]);

  useEffect(() => {
    const fetchEnrollmentDetails = async () => {
      if (!student || !student.id || !authToken) return;
      try {
        const res = await fetch(`${BASE_URL}/enrollments/${student.id}/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!res.ok)
          throw new Error(`Failed to fetch enrollment: ${res.status}`);
        const data = await res.json();

        // Helper to resolve course name if backend returns an id or nested object
        const resolveCourseName = (d) => {
          if (!d) return "";
          if (d.course_name) return d.course_name;
          if (d.course && typeof d.course === "object")
            return d.course.course_name || d.course.name || "";
          if (
            d.course &&
            (typeof d.course === "number" || typeof d.course === "string")
          ) {
            // try to find in courseOptions by id
            const found = courseOptions.find(
              (c) => String(c.id) === String(d.course)
            );
            return found
              ? found.course_name || found.name || String(d.course)
              : String(d.course);
          }
          return "";
        };

        const resolvedStudentName =
          data.student_name ||
          (data.student && (data.student.student_name || data.student.name)) ||
          (data.lead && (data.lead.student_name || data.lead.name)) ||
          (student && student.student_name) ||
          "";

        const resolvedParentsName =
          data.parents_name ||
          (data.parent_name && data.parent_name) ||
          (data.parents && data.parents) ||
          (data.lead && (data.lead.parents_name || data.lead.parents)) ||
          (student && student.parents_name) ||
          "";

        const resolvedCourseName =
          resolveCourseName(data) || student?.course_name || "";

        setFormData((prev) => ({
          ...prev,
          ...data,
          student_name: resolvedStudentName,
          parents_name: resolvedParentsName,
          email:
            data.email || (data.lead && data.lead.email) || prev.email || "",
          phone_number:
            data.phone_number ||
            (data.lead && data.lead.phone_number) ||
            prev.phone_number ||
            "",
          course_name: resolvedCourseName,
          batch_name: data.batch_name || prev.batch_name || "",
          assigned_teacher:
            data.assigned_teacher || prev.assigned_teacher || "",
          course_duration:
            data.course_duration ||
            (data.lead && data.lead.course_duration) ||
            prev.course_duration ||
            "",
          starting_date: data.starting_date || prev.starting_date || "",
          total_payment: data.total_payment ?? prev.total_payment ?? "",
          first_installment:
            data.first_installment ?? prev.first_installment ?? "",
          second_installment:
            data.second_installment ?? prev.second_installment ?? "",
          third_installment:
            data.third_installment ?? prev.third_installment ?? "",
          last_pay_date: data.last_pay_date || prev.last_pay_date || "",
          payment_completed:
            typeof data.payment_completed === "boolean"
              ? data.payment_completed
              : prev.payment_completed,
          invoice: data.invoice
            ? data.invoice.map((inv) => ({
                ...inv,
                file: null,
                previewUrl: inv?.url || "",
              }))
            : prev.invoice || [],
          remarks: data.remarks || prev.remarks || "",
          lead: { ...(data.lead || {}), ...(prev.lead || {}) },
          created_at:
            data.created_at || data.enrollment_created_at || prev.created_at,
          updated_at:
            data.updated_at || data.enrollment_updated_at || prev.updated_at,
        }));
      } catch (err) {
        console.error("Error fetching enrollment details:", err);
      }
    };

    fetchEnrollmentDetails();
  }, [student, authToken, courseOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // helper to update nested lead fields
  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      lead: {
        ...(prev.lead || {}),
        [name]: value,
      },
    }));
  };

  const handleInvoiceChange = (index, field, value) => {
    const updatedInvoices = formData.invoice.map((inv, i) =>
      i === index ? { ...inv, [field]: value } : inv
    );
    setFormData((prev) => ({ ...prev, invoice: updatedInvoices }));
  };

  const addInvoiceField = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      // invoice entries may include a File object (file) and a local preview URL (previewUrl)
      invoice: [
        ...prev.invoice,
        { name: "", url: "", date: today, file: null, previewUrl: "" },
      ],
    }));
  };

  const removeInvoiceField = (index) => {
    // revoke any object URL created for the invoice being removed
    setFormData((prev) => {
      const toRemove = prev.invoice[index];
      try {
        if (toRemove && toRemove.previewUrl)
          URL.revokeObjectURL(toRemove.previewUrl);
      } catch (e) {
        // ignore
      }
      return {
        ...prev,
        invoice: prev.invoice.filter((_, i) => i !== index),
      };
    });
  };

  // handle file selection for an invoice row (image or pdf)
  const handleInvoiceFileChange = (index, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => {
      // revoke previous preview if present
      const prevEntry = prev.invoice[index] || {};
      try {
        if (prevEntry && prevEntry.previewUrl)
          URL.revokeObjectURL(prevEntry.previewUrl);
      } catch (e) {}
      const today = new Date().toISOString().split("T")[0];
      const updated = prev.invoice.map((inv, i) =>
        i === index
          ? {
              ...inv,
              file,
              previewUrl,
              // set url to preview for preview/opening convenience but backend upload should replace this
              url: previewUrl,
              name: inv.name || file.name,
              date: inv.date || today,
            }
          : inv
      );
      return { ...prev, invoice: updated };
    });
  };

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      try {
        (formData.invoice || []).forEach((inv) => {
          if (inv && inv.previewUrl) URL.revokeObjectURL(inv.previewUrl);
        });
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedStudentData = {
      ...formData,
      total_payment: formData.total_payment
        ? parseFloat(formData.total_payment)
        : null,
      first_installment: formData.first_installment
        ? parseFloat(formData.first_installment)
        : null,
      second_installment: formData.second_installment
        ? parseFloat(formData.second_installment)
        : null,
      third_installment: formData.third_installment
        ? parseFloat(formData.third_installment)
        : null,

      // Fix for the date format issue:
      last_pay_date: formData.last_pay_date || null,

      // accept invoices if they have a file, external url, or name
      invoice: formData.invoice.filter(
        (inv) => inv.file || inv.url || inv.name
      ),
    };

    // Coerce course id to number when possible (backend expects id)
    if (
      updatedStudentData.course !== undefined &&
      updatedStudentData.course !== null &&
      typeof updatedStudentData.course === "string" &&
      /^\d+$/.test(updatedStudentData.course)
    ) {
      updatedStudentData.course = parseInt(updatedStudentData.course, 10);
    }

    onSave(updatedStudentData);
    onClose();
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 overflow-y-auto p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto my-8 transform transition-all animate-scale-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            Edit Enrolled Student
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Student Details */}
          <div>
            <label
              htmlFor="student_name"
              className="block text-sm font-medium text-gray-700"
            >
              Student Name
            </label>
            <input
              type="text"
              name="student_name"
              id="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          {/* Lead student name removed per request (initial lead data still loaded into formData) */}
          <div>
            <label
              htmlFor="parents_name"
              className="block text-sm font-medium text-gray-700"
            >
              Parents' Name
            </label>
            <input
              type="text"
              name="parents_name"
              id="parents_name"
              value={formData.parents_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700"
            >
              Phone
            </label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="lead_phone_number"
              className="block text-sm font-medium text-gray-700"
            >
              Lead Phone
            </label>
            <input
              type="tel"
              name="phone_number"
              id="lead_phone_number"
              value={formData.lead?.phone_number || ""}
              onChange={handleLeadChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="whatsapp_number"
              className="block text-sm font-medium text-gray-700"
            >
              WhatsApp Number
            </label>
            <input
              type="tel"
              name="whatsapp_number"
              id="whatsapp_number"
              value={
                formData.whatsapp_number || formData.lead?.whatsapp_number || ""
              }
              onChange={(e) => {
                // keep both enrollment-level and lead fallback in sync
                handleChange(e);
                handleLeadChange({
                  target: { name: "whatsapp_number", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700"
            >
              Grade
            </label>
            <input
              type="text"
              name="grade"
              id="grade"
              value={formData.grade || formData.lead?.grade || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "grade", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="source"
              className="block text-sm font-medium text-gray-700"
            >
              Source
            </label>
            <input
              type="text"
              name="source"
              id="source"
              value={formData.source || formData.lead?.source || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "source", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="class_type"
              className="block text-sm font-medium text-gray-700"
            >
              Class Type
            </label>
            <select
              name="class_type"
              id="class_type"
              value={formData.class_type || formData.lead?.class_type || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "class_type", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Class</option>
              <option value="Online">Online</option>
              <option value="Physical">Physical</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="shift"
              className="block text-sm font-medium text-gray-700"
            >
              Shift
            </label>
            <input
              type="text"
              name="shift"
              id="shift"
              value={formData.shift || formData.lead?.shift || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "shift", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <label className="block text-sm font-medium text-gray-700 mr-3">
              Device
            </label>
            <input
              type="checkbox"
              name="device"
              checked={!!(formData.device || formData.lead?.device)}
              onChange={(e) => {
                const val = e.target.checked ? "Yes" : "No";
                setFormData((prev) => ({ ...prev, device: val }));
                handleLeadChange({ target: { name: "device", value: val } });
              }}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>

          <div>
            <label
              htmlFor="previous_coding_experience"
              className="block text-sm font-medium text-gray-700"
            >
              Previous Coding Experience
            </label>
            <input
              type="text"
              name="previous_coding_experience"
              id="previous_coding_experience"
              value={
                formData.previous_coding_experience ||
                formData.lead?.previous_coding_experience ||
                ""
              }
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: {
                    name: "previous_coding_experience",
                    value: e.target.value,
                  },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="course_name"
              className="block text-sm font-medium text-gray-700"
            >
              Course
            </label>
            <select
              name="course"
              id="course"
              value={formData.course ?? ""}
              onChange={(e) => {
                const selectedId = e.target.value;
                // find the course object
                const found = courseOptions.find(
                  (c) => String(c.id) === String(selectedId)
                );
                setFormData((prev) => ({
                  ...prev,
                  course: selectedId || null,
                  course_name: found
                    ? found.course_name || found.name || ""
                    : prev.course_name,
                }));
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Course</option>
              {courseOptions.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {option.course_name || option.name || String(option.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="batch_name"
              className="block text-sm font-medium text-gray-700"
            >
              Batch Name
            </label>
            <input
              type="text"
              name="batch_name"
              id="batch_name"
              value={formData.batch_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="assigned_teacher"
              className="block text-sm font-medium text-gray-700"
            >
              Assigned Teacher
            </label>
            <input
              type="text"
              name="assigned_teacher"
              id="assigned_teacher"
              value={formData.assigned_teacher}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="course_duration"
              className="block text-sm font-medium text-gray-700"
            >
              Course Duration
            </label>
            <input
              type="text"
              name="course_duration"
              id="course_duration"
              value={formData.course_duration}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="starting_date"
              className="block text-sm font-medium text-gray-700"
            >
              Starting Date
            </label>
            <input
              type="date"
              name="starting_date"
              id="starting_date"
              value={formData.starting_date}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Payment Details */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t pt-4 mt-4">
            <div>
              <label
                htmlFor="total_payment"
                className="block text-sm font-medium text-gray-700"
              >
                Total Payment
              </label>
              <input
                type="number"
                name="total_payment"
                id="total_payment"
                value={formData.total_payment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mr-3">
                Payment Completed
              </label>
              <input
                type="checkbox"
                name="payment_completed"
                checked={!!formData.payment_completed}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_completed: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div>
              <label
                htmlFor="first_installment"
                className="block text-sm font-medium text-gray-700"
              >
                1st Installment
              </label>
              <input
                type="number"
                name="first_installment"
                id="first_installment"
                value={formData.first_installment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="second_installment"
                className="block text-sm font-medium text-gray-700"
              >
                2nd Installment
              </label>
              <input
                type="number"
                name="second_installment"
                id="second_installment"
                value={formData.second_installment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="col-span-1">
              <label
                htmlFor="third_installment"
                className="block text-sm font-medium text-gray-700"
              >
                3rd Installment
              </label>
              <input
                type="number"
                name="third_installment"
                id="third_installment"
                value={formData.third_installment}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="col-span-1">
              <label
                htmlFor="last_pay_date"
                className="block text-sm font-medium text-gray-700"
              >
                Last Pay Date
              </label>
              <input
                type="date"
                name="last_pay_date"
                id="last_pay_date"
                value={formData.last_pay_date}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Invoice Section */}
          <div className="md:col-span-2 border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Invoices</h3>
            {formData.invoice.map((inv, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-end gap-2 mb-3"
              >
                <div className="flex-grow">
                  <label
                    htmlFor={`invoiceName-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Invoice Name
                  </label>
                  <input
                    type="text"
                    id={`invoiceName-${index}`}
                    value={inv.name || ""}
                    onChange={(e) =>
                      handleInvoiceChange(index, "name", e.target.value)
                    }
                    placeholder="e.g., Final Invoice"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <div className="flex-grow">
                  {/* File upload for image or PDF - stores File in invoice.file and creates previewUrl */}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Upload (image / PDF)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) =>
                        handleInvoiceFileChange(index, e.target.files[0])
                      }
                      className="mt-1"
                    />
                    {/* Preview: prefer local previewUrl (uploaded file), else show external URL preview/link */}
                    {(() => {
                      if (inv.previewUrl) {
                        if (
                          inv.file &&
                          inv.file.type &&
                          inv.file.type.startsWith("image/")
                        ) {
                          return (
                            <img
                              src={inv.previewUrl}
                              alt={inv.name || "invoice-preview"}
                              className="mt-2 w-32 h-20 object-contain border rounded"
                            />
                          );
                        }
                        return (
                          <div className="mt-2 text-sm">
                            <a
                              href={inv.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              Open uploaded PDF
                            </a>
                          </div>
                        );
                      }
                      if (inv.url) {
                        if (/(jpe?g|png|gif|webp|bmp)$/i.test(inv.url)) {
                          return (
                            <img
                              src={inv.url}
                              alt={inv.name || "invoice"}
                              className="mt-2 w-32 h-20 object-contain border rounded"
                            />
                          );
                        }
                        if (/.pdf($|\?)/i.test(inv.url)) {
                          return (
                            <div className="mt-2 text-sm">
                              <a
                                href={inv.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                Open PDF
                              </a>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="flex-grow-0">
                  <label
                    htmlFor={`invoiceDate-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    id={`invoiceDate-${index}`}
                    value={inv.date || ""}
                    onChange={(e) =>
                      handleInvoiceChange(index, "date", e.target.value)
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeInvoiceField(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
                  title="Remove Invoice"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addInvoiceField}
              className="flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors mt-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" /> Add Invoice
            </button>
          </div>

          {/* Remarks (full width) */}
          <div className="md:col-span-2">
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700"
            >
              Remarks
            </label>
            <textarea
              name="remarks"
              id="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <div>
            <label
              htmlFor="adset_name"
              className="block text-sm font-medium text-gray-700"
            >
              Adset Name
            </label>
            <input
              type="text"
              name="adset_name"
              id="adset_name"
              value={formData.adset_name || formData.lead?.adset_name || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "adset_name", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="address_line_1"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 1
            </label>
            <input
              type="text"
              name="address_line_1"
              id="address_line_1"
              value={
                formData.address_line_1 || formData.lead?.address_line_1 || ""
              }
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "address_line_1", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="address_line_2"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 2
            </label>
            <input
              type="text"
              name="address_line_2"
              id="address_line_2"
              value={
                formData.address_line_2 || formData.lead?.address_line_2 || ""
              }
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "address_line_2", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              name="city"
              id="city"
              value={formData.city || formData.lead?.city || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "city", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              name="county"
              id="county"
              value={formData.county || formData.lead?.county || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "county", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              name="post_code"
              id="post_code"
              value={formData.post_code || formData.lead?.post_code || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "post_code", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <label className="block text-sm font-medium text-gray-700 mr-3">
              Demo Scheduled
            </label>
            <input
              type="checkbox"
              name="demo_scheduled"
              checked={
                !!(formData.demo_scheduled || formData.lead?.demo_scheduled)
              }
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  demo_scheduled: e.target.checked,
                }));
                handleLeadChange({
                  target: { name: "demo_scheduled", value: e.target.checked },
                });
              }}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>

          {/* Metadata (read-only) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Created At
              </label>
              <input
                type="text"
                value={formData.created_at || ""}
                readOnly
                className="mt-1 block w-full border border-gray-200 rounded-md bg-gray-50 py-2 px-3 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Updated At
              </label>
              <input
                type="text"
                value={formData.updated_at || ""}
                readOnly
                className="mt-1 block w-full border border-gray-200 rounded-md bg-gray-50 py-2 px-3 sm:text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrolledStudentEditModal;
