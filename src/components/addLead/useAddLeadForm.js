import { useEffect, useMemo, useRef, useState } from "react";
import { BASE_URL } from "../../config";
import { getTodayDate, formatDateForBackend } from "./helpers.jsx";

export default function useAddLeadForm({ courses = [], authToken, onClose, onSave, isAdmin, usersApi }) {
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
    course_type: "",
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
    demo_scheduled: "",
    add_date: getTodayDate(),
    first_installment: "",
    first_invoice: null,
  });

  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const selectedCourse = useMemo(() => {
    if (!Array.isArray(courses)) return null;
    return courses.find(
      (c) => String(c.id) === String(formData.course_name) || String(c.id) === String(formData.course)
    );
  }, [courses, formData.course_name, formData.course]);

  const handleSubmit = async () => {
    // Required fields (align with labels showing RequiredLabel in AddLeadModal)
    const requiredFieldsList = [
      "student_name",
      "parents_name",
      "email",
      "phone_number",
      "whatsapp_number",
      "lead_type",
      "course_name",
      "class_type",
      "source",
      "add_date",
    ];
    const missing = requiredFieldsList.filter((f) => {
      const v = formData[f];
      if (v === null || v === undefined) return true;
      if (typeof v === "string" && v.trim() === "") return true;
      return false;
    });
    if (missing.length) {
      const e = {};
      missing.forEach((f) => (e[f] = "This field is required"));
      setErrors(e);
      return { ok: false, reason: "validation", missing, first: missing[0] };
    }

    if (formData.status === "Converted" && !formData.first_invoice) {
      setErrors({ first_invoice: "Invoice is required for Converted status" });
      alert("Invoice is required when setting status to 'Converted'");
      return { ok: false, reason: "invoice" };
    }

    const tempId = `new-${Date.now()}`;

    const selectedCourseId = selectedCourse ? selectedCourse.id : null;

    const backendPayload = {
      _id: tempId,
      student_name: formData.student_name.trim(),
      parents_name: formData.parents_name.trim(),
      email: formData.email,
      phone_number: String(formData.phone_number || "").trim(),
      whatsapp_number: String(formData.whatsapp_number || "").trim(),
      age: formData.age,
      grade: formData.grade,
      source: formData.source === "Select" ? "" : formData.source,
      class_type: formData.class_type === "Select" ? "" : formData.class_type,
      shift: formData.shift ? String(formData.shift).trim() : "",
      status: formData.status || "New",
      substatus: formData.sub_status || "New",
      device: formData.device === "Select" ? "" : formData.device,
      previous_coding_experience:
        formData.previous_coding_experience === "Select" ? "" : formData.previous_coding_experience,
      address_line_1: formData.address_line_1,
      address_line_2: formData.address_line_2,
      city: formData.city,
      county: formData.county,
      post_code: formData.post_code,
      value: formData.value,
      adset_name: formData.adset_name,
      remarks: formData.remarks,
      payment_type: formData.payment_type === "Select" ? "" : formData.payment_type,
      workshop_batch: formData.workshop_batch,
      lead_type: formData.lead_type,
      school_college_name: formData.school_college_name || "",
      demo_scheduled: formData.demo_scheduled || "",
      course: selectedCourseId,
      course_name: selectedCourse?.course_name ?? formData.course_name,
      course_duration: formData.course_duration,
      last_call: formatDateForBackend(formData.last_call),
      next_call: formatDateForBackend(formData.next_call),
      add_date: formData.add_date,
      first_installment: formData.first_installment ? parseFloat(formData.first_installment) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Remove empty optional keys
    const optionalKeys = [
      "grade",
      "source",
      "class_type",
      "shift",
      "payment_type",
      "device",
      "previous_coding_experience",
      "school_college_name",
      "demo_scheduled",
    ];
    optionalKeys.forEach((k) => {
      if (backendPayload[k] === "" || backendPayload[k] === null || backendPayload[k] === undefined) {
        delete backendPayload[k];
      }
    });
    if (!backendPayload.last_call) delete backendPayload.last_call;
    if (!backendPayload.next_call) delete backendPayload.next_call;

    // Optimistic save
    try { onSave(backendPayload); } catch (_) {}
    try { onClose(); } catch (_) {}

    // Build request options
    let requestOptions;
    if (formData.first_invoice) {
      const formDataToSend = new FormData();
      Object.entries(backendPayload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) formDataToSend.append(k, v);
      });
      formDataToSend.append("first_invoice", formData.first_invoice);
      requestOptions = { method: "POST", headers: { Authorization: `Token ${authToken}` }, body: formDataToSend };
    } else {
      requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${authToken}` },
        body: JSON.stringify(backendPayload),
      };
    }

    const response = await fetch(`${BASE_URL}/leads/`, requestOptions);
    if (!response.ok) {
      let bodyText = null; let bodyJson = null;
      try { bodyJson = await response.json(); } catch { try { bodyText = await response.text(); } catch (e2) { bodyText = `<unreadable: ${e2}>`; } }
      const userMessage = bodyJson ? JSON.stringify(bodyJson) : bodyText || `Status ${response.status}`;
      alert(`Failed to add lead. ${userMessage}`);
      return { ok: false, status: response.status };
    }

    const result = await response.json();
    const serverLead = {
      ...backendPayload,
      _id: String(result.id),
      id: result.id,
      created_at: result.created_at || backendPayload.created_at,
      updated_at: result.updated_at || backendPayload.updated_at,
      course_name: result.course_name ?? backendPayload.course_name,
      course: result.course ?? backendPayload.course,
      substatus: result.substatus ?? result.sub_status ?? backendPayload.substatus,
      sub_status: result.sub_status ?? result.substatus ?? backendPayload.sub_status,
      course_duration: result.course_duration ?? backendPayload.course_duration,
      logs_url: `${BASE_URL}/leads/${result.id}/logs/`,
    };
    try { onSave(serverLead); } catch (_) {}
    return { ok: true, data: serverLead };
  };

  return {
    formData,
    setField,
    errors,
    setErrors,
    handleSubmit,
  };
}
