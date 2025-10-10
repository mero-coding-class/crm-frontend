import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { BASE_URL } from "../../config";

export default function useEnrolledStudentForm(student, onSave) {
  const { authToken } = useAuth();

  const [courseOptions, setCourseOptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const buildInitialForm = useCallback(() => {
    const lead = student?.lead || {};
    const buildInitialInvoices = () => {
      const base = [];
      if (lead && lead.first_invoice) {
        base.push({
          name: "Lead invoice",
          url: lead.first_invoice,
          date: "",
          file: null,
          previewUrl: lead.first_invoice,
        });
      }
      if (student?.second_invoice) {
        base.push({
          name: "Second invoice",
          url: student.second_invoice,
          date: "",
          file: null,
          previewUrl: student.second_invoice,
        });
      }
      if (student?.third_invoice) {
        base.push({
          name: "Third invoice",
          url: student.third_invoice,
          date: "",
          file: null,
          previewUrl: student.third_invoice,
        });
      }
      return base;
    };
    return {
      ...student,
      student_name: student?.student_name ?? lead.student_name ?? "",
      parents_name: student?.parents_name ?? lead.parents_name ?? "",
      email: student?.email ?? lead.email ?? "",
      phone_number: student?.phone_number ?? lead.phone_number ?? "",
      course: student?.course ?? lead.course ?? "",
      batchname: student?.batchname ?? "",
      assigned_teacher: student?.assigned_teacher ?? "",
      course_duration: student?.course_duration ?? lead.course_duration ?? "",
      payment_type: student?.payment_type ?? lead.payment_type ?? "",
      starting_date: student?.starting_date || "" ? String(student.starting_date || "").split("T")[0] : "",
      total_payment: student?.total_payment ?? "",
      first_installment: student?.first_installment ?? lead.first_installment ?? "",
      second_installment: student?.second_installment ?? "",
      third_installment: student?.third_installment ?? "",
      second_invoice_url: student?.second_invoice || "",
      third_invoice_url: student?.third_invoice || "",
      second_invoice_file: null,
      third_invoice_file: null,
      last_pay_date: student?.last_pay_date || "" ? String(student.last_pay_date || "").split("T")[0] : "",
      next_pay_date: student?.next_pay_date || "" ? String(student.next_pay_date || "").split("T")[0] : "",
      payment_completed: student?.payment_completed ?? false,
      created_at: student?.created_at ?? student?.enrollment_created_at ?? "",
      updated_at: student?.updated_at ?? student?.enrollment_updated_at ?? "",
      remarks: student?.remarks ?? lead.remarks ?? "",
      invoice: buildInitialInvoices(),
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
  }, [student]);

  const [formData, setFormData] = useState(buildInitialForm);
  useEffect(() => setFormData(buildInitialForm()), [buildInitialForm]);

  const originalSnapshotRef = useRef(null);
  const normalizeForCompare = useCallback((data) => {
    const keys = [
      "student_name","parents_name","email","phone_number","course","batchname","batch_name","assigned_teacher","course_duration","starting_date","total_payment","first_installment","second_installment","third_installment","last_pay_date","next_pay_date","payment_completed","payment_type","remarks"
    ];
    const obj = {};
    keys.forEach((k) => {
      let val = data && data[k] !== undefined && data[k] !== null ? data[k] : null;
      if (val && (k === "starting_date" || k === "last_pay_date")) {
        try { val = String(val).split("T")[0]; } catch (e) {}
      }
      if (val !== null && ["total_payment","first_installment","second_installment","third_installment"].includes(k)) {
        const n = Number(val);
        val = Number.isFinite(n) ? n : null;
      }
      if (k === "payment_completed") {
        if (val === null) {
          // leave null
        } else if (typeof val === "string") {
          const s = val.toLowerCase();
          val = s === "true" || s === "yes" || s === "1";
        } else {
          val = !!val;
        }
      }
      obj[k] = val;
    });
    obj.invoice = (Array.isArray(data?.invoice) ? data.invoice : []).map((i) => ({ name: i?.name || "", url: i?.url || "", date: i?.date || "", hasFile: !!i?.file }));
    return obj;
  }, []);

  useEffect(() => {
    originalSnapshotRef.current = normalizeForCompare(student || {});
  }, [student, normalizeForCompare]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!authToken) return;
      try {
        const response = await fetch(`${BASE_URL}/courses/`, {
          method: "GET",
          headers: { Authorization: `Token ${authToken}`, "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.results || [];
        setCourseOptions(list);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
    fetchCourses();
  }, [authToken]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const handleLeadChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, lead: { ...(prev.lead || {}), [name]: value } }));
  }, []);

  const addInvoiceField = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, invoice: [...(prev.invoice || []), { name: "", url: "", date: today, file: null, previewUrl: "" }] }));
  }, []);

  const removeInvoiceField = useCallback((index) => {
    setFormData((prev) => ({ ...prev, invoice: (prev.invoice || []).filter((_, i) => i !== index) }));
  }, []);

  const handleSecondInvoiceFileChange = useCallback((file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, second_invoice_file: file, second_invoice_url: previewUrl }));
  }, []);

  const handleThirdInvoiceFileChange = useCallback((file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, third_invoice_file: file, third_invoice_url: previewUrl }));
  }, []);

  const fetchEnrollmentDetails = useCallback(async () => {
    if (!student || !student.id || !authToken) return;
    try {
      const res = await fetch(`${BASE_URL}/enrollments/${student.id}/`, {
        method: "GET",
        headers: { Authorization: `Token ${authToken}`, "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to fetch enrollment: ${res.status}`);
      const data = await res.json();
      const resolveCourseName = (d) => {
        if (!d) return "";
        if (d.course_name) return d.course_name;
        if (d.course && typeof d.course === "object") return d.course.course_name || d.course.name || "";
        if (d.course && (typeof d.course === "number" || typeof d.course === "string")) {
          const c = (courseOptions || []).find((x) => String(x.id) === String(d.course));
          return c ? c.course_name || c.name || "" : "";
        }
        return "";
      };
      setFormData((prev) => ({
        ...prev,
        student_name: data.student_name ?? prev.student_name,
        parents_name: data.parents_name ?? prev.parents_name,
        email: data.email ?? prev.email,
        phone_number: data.phone_number ?? prev.phone_number,
        course: data.course ?? prev.course,
        course_name: resolveCourseName(data) || prev.course_name,
        batchname: data.batchname ?? prev.batchname,
        assigned_teacher: data.assigned_teacher ?? prev.assigned_teacher,
        course_duration: data.course_duration ?? prev.course_duration,
        payment_type: data.payment_type ?? prev.payment_type,
        starting_date: data.starting_date ? String(data.starting_date).split("T")[0] : prev.starting_date,
        total_payment: data.total_payment ?? prev.total_payment,
        first_installment: data.first_installment ?? prev.first_installment,
        second_installment: data.second_installment ?? prev.second_installment,
        third_installment: data.third_installment ?? prev.third_installment,
        last_pay_date: data.last_pay_date ? String(data.last_pay_date).split("T")[0] : prev.last_pay_date,
        next_pay_date: data.next_pay_date ? String(data.next_pay_date).split("T")[0] : prev.next_pay_date,
        payment_completed: data.payment_completed ?? prev.payment_completed,
        second_invoice_url: data.second_invoice || prev.second_invoice_url,
        third_invoice_url: data.third_invoice || prev.third_invoice_url,
        remarks: data.remarks ?? prev.remarks,
        lead: { ...(prev.lead || {}), ...(data.lead || {}) },
        updated_at: data.updated_at || prev.updated_at,
      }));
    } catch (err) {
      console.error("Error fetching enrollment details:", err);
    }
  }, [student, authToken, courseOptions]);

  useEffect(() => { fetchEnrollmentDetails(); }, [fetchEnrollmentDetails]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    setSaveError(null);
    const updatedStudentData = {
      ...formData,
      batchname: formData.batchname ?? formData.batch_name ?? "",
      course_duration: formData.course_duration ?? "",
      total_payment: formData.total_payment ? parseFloat(formData.total_payment) : null,
      first_installment: formData.first_installment ? parseFloat(formData.first_installment) : null,
      second_installment: formData.second_installment ? parseFloat(formData.second_installment) : null,
      third_installment: formData.third_installment ? parseFloat(formData.third_installment) : null,
      last_pay_date: formData.last_pay_date ? String(formData.last_pay_date).split("T")[0] : null,
      next_pay_date: formData.next_pay_date ? String(formData.next_pay_date).split("T")[0] : null,
      starting_date: formData.starting_date ? String(formData.starting_date).split("T")[0] : null,
      second_invoice_file: formData.second_invoice_file || null,
      third_invoice_file: formData.third_invoice_file || null,
    };
    if (updatedStudentData.payment_completed === "" || updatedStudentData.payment_completed === null) {
      updatedStudentData.payment_completed = null;
    } else if (typeof updatedStudentData.payment_completed === "string") {
      const s = updatedStudentData.payment_completed.toLowerCase();
      updatedStudentData.payment_completed = s === "true" || s === "yes" || s === "1";
    } else {
      updatedStudentData.payment_completed = !!updatedStudentData.payment_completed;
    }
    if (updatedStudentData.course !== undefined && updatedStudentData.course !== null && typeof updatedStudentData.course === "string" && /^\d+$/.test(updatedStudentData.course)) {
      updatedStudentData.course = parseInt(updatedStudentData.course, 10);
    }

    try {
      const compareSnapshot = normalizeForCompare(updatedStudentData);
      const original = originalSnapshotRef.current || {};
      const snapshotsEqual = JSON.stringify(compareSnapshot) === JSON.stringify(original);
      const hasNewFiles = updatedStudentData.second_invoice_file instanceof File || updatedStudentData.third_invoice_file instanceof File;
      if (snapshotsEqual && !hasNewFiles) {
        setSaveSuccess("No changes to save.");
        return;
      }
      setIsSaving(true);
      const resp = await Promise.resolve(onSave(updatedStudentData));
      await fetchEnrollmentDetails();
      if (resp && (resp.second_invoice || resp.third_invoice)) {
        setSaveSuccess("Invoice uploaded successfully");
      }
    } catch (err) {
      console.error("Failed to save enrollment:", err);
      setSaveError(err && err.message ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave, normalizeForCompare, fetchEnrollmentDetails]);

  return {
    authToken,
    courseOptions,
    formData,
    setFormData,
    isSaving,
    saveError,
    saveSuccess,
    // handlers
    handleChange,
    handleLeadChange,
    addInvoiceField,
    removeInvoiceField,
    handleSecondInvoiceFileChange,
    handleThirdInvoiceFileChange,
    handleSubmit,
  };
}
