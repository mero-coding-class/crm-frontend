import React, { useState, useEffect, useRef } from "react";
import { PAYMENT_TYPE_OPTIONS } from "../constants/paymentOptions";
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";
import { BASE_URL } from "../config";

const EnrolledStudentEditModal = ({
  student,
  onClose,
  onSave,
  teachers = [],
}) => {
  const { authToken } = useAuth();
  // store full course objects (id, course_name, ...)
  const [courseOptions, setCourseOptions] = useState([]);
  const [formData, setFormData] = useState(() => {
    // Merge lead info immediately if available
    const lead = student?.lead || {};
    return {
      ...student,
      student_name: student?.student_name ?? lead.student_name ?? "",
      parents_name: student?.parents_name ?? lead.parents_name ?? "",
      email: student?.email ?? lead.email ?? "",
      phone_number: student?.phone_number ?? lead.phone_number ?? "",
      course: student?.course ?? lead.course ?? "",
      batchname: student?.batchname ?? "", // backend field
      assigned_teacher: student?.assigned_teacher ?? "",
      course_duration: student?.course_duration ?? lead.course_duration ?? "",
      payment_type: student?.payment_type ?? lead.payment_type ?? "",
      starting_date:
        student?.starting_date || ""
          ? String(student.starting_date || "").split("T")[0]
          : "",
      total_payment: student?.total_payment ?? "",
      first_installment: student?.first_installment ?? "",
      second_installment: student?.second_installment ?? "",
      third_installment: student?.third_installment ?? "",
      last_pay_date:
        student?.last_pay_date || ""
          ? String(student.last_pay_date || "").split("T")[0]
          : "",
      next_pay_date:
        student?.next_pay_date || ""
          ? String(student.next_pay_date || "").split("T")[0]
          : "",
      payment_completed: student?.payment_completed ?? false,
      created_at: student?.created_at ?? student?.enrollment_created_at ?? "",
      updated_at: student?.updated_at ?? student?.enrollment_updated_at ?? "",
      remarks: student?.remarks ?? lead.remarks ?? "",
      invoice: Array.isArray(student?.invoice)
        ? student.invoice.map((inv) => ({
            ...inv,
            file: null,
            previewUrl: inv?.url || "",
          }))
        : [],
      lead: {
        ...lead,
        id: lead.id || "",
        status: lead.status || "",
        substatus: lead.substatus || "",
        add_date: lead.add_date || "",
        parents_name: lead.parents_name || "",
        student_name: lead.student_name || "",
        email: lead.email || "",
        phone_number: lead.phone_number || "",
        whatsapp_number: lead.whatsapp_number || "",
        age: lead.age || "",
        grade: lead.grade || "",
        source: lead.source || "",
        class_type: lead.class_type || "",
        lead_type: lead.lead_type || "",
        shift: lead.shift || "",
        previous_coding_experience: lead.previous_coding_experience || "",
        last_call: lead.last_call || "",
        next_call: lead.next_call || "",
        value: lead.value || "",
        adset_name: lead.adset_name || "",
        course_duration: lead.course_duration || "",
        payment_type: lead.payment_type || "",
        device: lead.device || "",
        school_college_name: lead.school_college_name || "",
        remarks: lead.remarks || "",
        address_line_1: lead.address_line_1 || "",
        address_line_2: lead.address_line_2 || "",
        city: lead.city || "",
        county: lead.county || "",
        post_code: lead.post_code || "",
        scheduled_taken: lead.scheduled_taken || lead.demo_scheduled || "",
        created_at: lead.created_at || "",
        updated_at: lead.updated_at || "",
        course: lead.course || "",
        assigned_to: lead.assigned_to || "",
        created_by: lead.created_by || "",
      },
    };
  });

  const modalRef = useRef(null);
  // Keep a snapshot of the original student data to detect if anything changed
  const originalSnapshotRef = useRef(null);

  const getFileNameFromUrl = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : url;
    } catch (e) {
      const parts = url.split("/");
      return parts.length > 0 ? parts[parts.length - 1] : url;
    }
  };

  const normalizeForCompare = (data) => {
    const keys = [
      "student_name",
      "parents_name",
      "email",
      "phone_number",
      "course",
      // accept both batch_name and batchname variants
      "batchname",
      "batch_name",
      "assigned_teacher",
      "course_duration",
      "starting_date",
      "total_payment",
      "first_installment",
      "second_installment",
      "third_installment",
      "last_pay_date",
      "next_pay_date",
      "payment_completed",
      "payment_type",
      "remarks",
    ];
    const obj = {};
    keys.forEach((k) => {
      let val =
        data && data[k] !== undefined && data[k] !== null ? data[k] : null;
      // normalize dates to YYYY-MM-DD strings for comparison
      if (val && (k === "starting_date" || k === "last_pay_date")) {
        try {
          val = String(val).split("T")[0];
        } catch (e) {}
      }
      // normalize numeric-like payment fields to numbers or null
      if (
        val !== null &&
        [
          "total_payment",
          "first_installment",
          "second_installment",
          "third_installment",
        ].includes(k)
      ) {
        const n = Number(val);
        val = Number.isFinite(n) ? n : null;
      }
      // normalize payment_completed to boolean or null
      if (k === "payment_completed") {
        if (val === null) {
          val = null;
        } else if (typeof val === "string") {
          const s = val.toLowerCase();
          val = s === "true" || s === "yes" || s === "1";
        } else {
          val = !!val;
        }
      }
      obj[k] = val;
    });
    obj.invoice = (Array.isArray(data?.invoice) ? data.invoice : []).map(
      (i) => ({
        name: i?.name || "",
        url: i?.url || "",
        date: i?.date || "",
        hasFile: !!i?.file,
      })
    );
    return obj;
  };
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
        // Normalize paginated responses: support { results: [] }
        const list = Array.isArray(data) ? data : data?.results || [];
        setCourseOptions(list);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };

    if (authToken) fetchCourses();
  }, [authToken]);

  // Update original snapshot when student prop changes
  useEffect(() => {
    originalSnapshotRef.current = normalizeForCompare(student || {});
  }, [student]);

  // Exposed helper to load enrollment details (used on mount and after save)
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
      if (!res.ok) throw new Error(`Failed to fetch enrollment: ${res.status}`);
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

      setFormData((prev) => {
        const merged = {
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
          starting_date: data.starting_date
            ? String(data.starting_date).split("T")[0]
            : prev.starting_date || "",
          total_payment: data.total_payment ?? prev.total_payment ?? "",
          first_installment:
            data.first_installment ?? prev.first_installment ?? "",
          second_installment:
            data.second_installment ?? prev.second_installment ?? "",
          third_installment:
            data.third_installment ?? prev.third_installment ?? "",
          last_pay_date: data.last_pay_date
            ? String(data.last_pay_date).split("T")[0]
            : prev.last_pay_date || "",
          next_pay_date: data.next_pay_date
            ? String(data.next_pay_date).split("T")[0]
            : prev.next_pay_date || "",
          payment_completed:
            typeof data.payment_completed === "boolean"
              ? data.payment_completed
              : prev.payment_completed,
          // Normalize invoice field: backend may return an array, a single object,
          // or a string URL. Convert all variants to an array of invoice objects.
          invoice: (() => {
            try {
              if (!data.invoice) return prev.invoice || [];
              let arr = [];
              if (Array.isArray(data.invoice)) arr = data.invoice;
              else if (typeof data.invoice === "string")
                arr = [{ url: data.invoice }];
              else if (typeof data.invoice === "object") arr = [data.invoice];
              return arr.map((inv) => ({
                ...inv,
                file: null,
                previewUrl: inv?.url || inv?.previewUrl || "",
              }));
            } catch (e) {
              return prev.invoice || [];
            }
          })(),
          remarks: data.remarks || prev.remarks || "",
          lead: { ...(data.lead || {}), ...(prev.lead || {}) },
          created_at:
            data.created_at || data.enrollment_created_at || prev.created_at,
          updated_at:
            data.updated_at || data.enrollment_updated_at || prev.updated_at,
        };
        // Update original snapshot to reflect the freshly fetched / merged form state
        try {
          originalSnapshotRef.current = normalizeForCompare(merged || {});
        } catch (e) {}
        return merged;
      });
    } catch (err) {
      console.error("Error fetching enrollment details:", err);
    }
  };

  useEffect(() => {
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

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    // We'll set isSaving only when we actually perform a network save

    const updatedStudentData = {
      ...formData,
      // prefer batchname field (table uses 'batchname')
      batchname: formData.batchname ?? formData.batch_name ?? "",
      course_duration: formData.course_duration ?? "",
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
      // Ensure dates are sent as YYYY-MM-DD (input[type=date] produces this format)
      last_pay_date: formData.last_pay_date
        ? String(formData.last_pay_date).split("T")[0]
        : null,
      next_pay_date: formData.next_pay_date
        ? String(formData.next_pay_date).split("T")[0]
        : null,
      // normalize starting_date for comparison/send
      starting_date: formData.starting_date
        ? String(formData.starting_date).split("T")[0]
        : null,
      invoice: Array.isArray(formData.invoice)
        ? formData.invoice.filter((inv) => inv.file || inv.url || inv.name)
        : [],
    };

    // Normalize payment_completed to boolean/null (table sends booleans)
    if (
      updatedStudentData.payment_completed === "" ||
      updatedStudentData.payment_completed === null
    ) {
      updatedStudentData.payment_completed = null;
    } else if (typeof updatedStudentData.payment_completed === "string") {
      const s = updatedStudentData.payment_completed.toLowerCase();
      updatedStudentData.payment_completed =
        s === "true" || s === "yes" || s === "1";
    } else {
      updatedStudentData.payment_completed =
        !!updatedStudentData.payment_completed;
    }

    // Coerce course id to number when possible
    if (
      updatedStudentData.course !== undefined &&
      updatedStudentData.course !== null &&
      typeof updatedStudentData.course === "string" &&
      /^\d+$/.test(updatedStudentData.course)
    ) {
      updatedStudentData.course = parseInt(updatedStudentData.course, 10);
    }

    try {
      // If nothing changed and there are no new files, skip network call
      const compareSnapshot = normalizeForCompare(updatedStudentData);
      const original = originalSnapshotRef.current || {};
      const snapshotsEqual =
        JSON.stringify(compareSnapshot) === JSON.stringify(original);
      const hasNewFiles = Array.isArray(updatedStudentData.invoice)
        ? updatedStudentData.invoice.some(
            (inv) => inv && inv.file instanceof File
          )
        : false;

      if (snapshotsEqual && !hasNewFiles) {
        setSaveSuccess("No changes to save");
        setTimeout(() => setSaveSuccess(null), 2000);
        return;
      }

      setIsSaving(true);

      // Call parent onSave which will perform the PATCH (and handles file uploads)
      // It returns a Promise because the parent handler is async; await it so
      // we can refresh the enrollment details and show the uploaded invoice(s)
      const resp = await Promise.resolve(onSave(updatedStudentData));

      // After parent saved, re-fetch enrollment details so modal can show
      // updated invoice URLs returned from the server.
      await fetchEnrollmentDetails();

      // If response has invoice urls, show success briefly
      if (resp && Array.isArray(resp.invoice) && resp.invoice.length > 0) {
        setSaveSuccess("Invoice uploaded");
        setTimeout(() => setSaveSuccess(null), 3000);
      }

      // Keep the modal open so the user can immediately see the uploaded file(s).
      // Optionally, we could close; leave it to the user to close.
    } catch (err) {
      console.error("Failed to save enrollment:", err);
      setSaveError(err && err.message ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
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
          {/* Latest invoice preview + show more */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latest Invoice
            </label>
            {formData.invoice && formData.invoice.length > 0 ? (
              <div className="space-y-2">
                {/* Show the newest (last) invoice prominently */}
                {(() => {
                  const latest = formData.invoice[formData.invoice.length - 1];
                  return (
                    <div className="flex items-center space-x-3">
                      <a
                        href={latest.previewUrl || latest.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-2 border rounded-md text-sm bg-white hover:bg-gray-50"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-600" />
                        {latest.name ||
                          getFileNameFromUrl(latest.url) ||
                          "View file"}
                      </a>
                      <span className="text-sm text-gray-500">
                        {latest.date || "--"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            showAllInvoices: !prev.showAllInvoices,
                          }));
                        }}
                        className="ml-2 px-2 py-1 text-sm border rounded-md bg-white hover:bg-gray-50"
                      >
                        {formData.showAllInvoices ? "Hide" : "Show more"}
                      </button>
                    </div>
                  );
                })()}

                {formData.showAllInvoices && (
                  <div className="mt-2 grid gap-2">
                    {formData.invoice.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <a
                            href={inv.previewUrl || inv.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 underline"
                          >
                            {inv.name ||
                              getFileNameFromUrl(inv.url) ||
                              `Invoice ${idx + 1}`}
                          </a>
                          <span className="text-sm text-gray-500">
                            {inv.date || "--"}
                          </span>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              handleInvoiceFileChange(idx, null) ||
                              removeInvoiceField(idx)
                            }
                            className="text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No invoices uploaded yet.</p>
            )}
          </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Device
            </label>
            <select
              name="device"
              value={formData.device || formData.lead?.device || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, device: val }));
                handleLeadChange({ target: { name: "device", value: val } });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
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
            <select
              name="assigned_teacher"
              id="assigned_teacher"
              value={formData.assigned_teacher || ""}
              onChange={(e) => {
                const val = e.target.value || null;
                setFormData((prev) => ({
                  ...prev,
                  assigned_teacher: val,
                }));
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="">-- Select Teacher --</option>
              {(Array.isArray(typeof teachers !== "undefined" ? teachers : [])
                ? teachers
                : []
              ).map((t) => (
                <option key={String(t.id)} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
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
              htmlFor="payment_type"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Type
            </label>
            <select
              name="payment_type"
              id="payment_type"
              value={formData.payment_type || formData.lead?.payment_type || ""}
              onChange={(e) => {
                handleChange(e);
                handleLeadChange({
                  target: { name: "payment_type", value: e.target.value },
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select</option>
              <option value="Cash">Cash</option>
              <option value="Office QR">Office QR</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
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
            <div className="col-span-1">
              <label
                htmlFor="next_pay_date"
                className="block text-sm font-medium text-gray-700"
              >
                Next Pay Date
              </label>
              <input
                type="date"
                name="next_pay_date"
                id="next_pay_date"
                value={formData.next_pay_date || ""}
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
                    {/* Hidden file input triggered by the Upload button for a cleaner UI */}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      id={`hidden-invoice-input-${index}`}
                      onChange={(e) =>
                        handleInvoiceFileChange(index, e.target.files[0])
                      }
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(
                            `hidden-invoice-input-${index}`
                          );
                          if (el) el.click();
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                      >
                        Choose File
                      </button>
                      <span className="text-sm text-gray-600">
                        {inv.file
                          ? inv.file.name
                          : inv.name || "No file chosen"}
                      </span>
                    </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Demo Scheduled
            </label>
            <select
              name="scheduled_taken"
              value={
                formData.scheduled_taken ||
                formData.lead?.scheduled_taken ||
                formData.lead?.demo_scheduled ||
                ""
              }
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, scheduled_taken: val }));
                handleLeadChange({
                  target: { name: "scheduled_taken", value: val },
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
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
