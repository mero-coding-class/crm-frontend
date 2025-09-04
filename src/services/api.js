// src/services/api.js

import { BASE_URL } from "../config";

/* ------------------------------------------------------------------ */
/* Shared response handler                                             */
/* ------------------------------------------------------------------ */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMsg = "An error occurred";
    try {
      const errData = await response.json();
      errorMsg = errData.detail || JSON.stringify(errData);
    } catch {
      try {
        errorMsg = await response.text();
      } catch {
        // ignore
      }
    }
    throw new Error(errorMsg);
  }
  return response.json();
};

/* ------------------------------------------------------------------ */
/* CSV import helpers                                                  */
/* ------------------------------------------------------------------ */

// normalize header keys like "Student Name" -> "student_name"
const _norm = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^\w]/g, "_");

// turn one CSV row into your backend payload (snake_case)
const _csvRowToLeadPayload = (row, courses) => {
  // normalize keys
  const nrow = {};
  for (const [k, v] of Object.entries(row)) nrow[_norm(k)] = v;

  // course id resolution: prefer course_id; else try by course name
  let courseId = nrow.course_id ?? null;
  if (!courseId && nrow.course) {
    const byName = courses?.find(
      (c) =>
        (c.course_name || c.name || "").toLowerCase() ===
        String(nrow.course).toLowerCase()
    );
    courseId = byName?.id ?? null;
  }

  return {
    student_name: nrow.student_name || nrow.student || "",
    parents_name: nrow.parents_name || nrow.parent_name || "",
    email: nrow.email || "",
    phone_number: nrow.phone_number || nrow.phone || "",
    whatsapp_number: nrow.whatsapp_number || nrow.whatsapp || "",
    age: nrow.age || "",
    grade: nrow.grade || "",
    course: courseId ?? nrow.course ?? null, // send id if we have it; else pass-through string/name
    source: nrow.source || "",
    add_date: nrow.add_date || "",

    last_call: nrow.last_call || null,
    next_call: nrow.next_call || null,
    status: nrow.status || "New",

    address_line_1: nrow.address_line_1 || nrow.permanent_address || "",
    address_line_2: nrow.address_line_2 || nrow.temporary_address || "",
    city: nrow.city || "",
    county: nrow.county || "",
    post_code: nrow.post_code || "",
    class_type: nrow.class_type || "",
    value: nrow.value || "",
    adset_name: nrow.adset_name || "",
    remarks: nrow.remarks || "",
    shift: nrow.shift || "",
    payment_type: nrow.payment_type || "",
    device: nrow.device || "",
    previous_coding_experience:
      nrow.previous_coding_experience || nrow.prev_coding || "",
    workshop_batch: nrow.workshop_batch || "",
    // change_log intentionally omitted on import
  };
};

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export const leadService = {
  getLeads: async (authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/leads/`, {
      headers: { Authorization: `Token ${authToken}` },
    });
    const backendLeads = await handleResponse(response);
    return backendLeads.map((lead) => ({
      _id: lead.id.toString(),
      id: lead.id,
      studentName: lead.student_name || "",
      parentsName: lead.parents_name || "",
      email: lead.email || "",
      phone: lead.phone_number || "",
      contactWhatsapp: lead.whatsapp_number || "",
      age: lead.age || "",
      grade: lead.grade || "",
      // If your API returns course_name instead of course, you can do:
      // course: lead.course_name || lead.course || "",
      course: lead.course || "",
      source: lead.source || "",
      addDate: lead.add_date || "",
      recentCall: lead.last_call || "",
      nextCall: lead.next_call || "",
      status: lead.status || "New",
      permanentAddress: lead.address_line_1 || "",
      temporaryAddress: lead.address_line_2 || "",
      city: lead.city || "",
      county: lead.county || "",
      postCode: lead.post_code || "",
      classType: lead.class_type || "",
      value: lead.value || "",
      adsetName: lead.adset_name || "",
      remarks: lead.remarks || "",
      shift: lead.shift || "",
      paymentType: lead.payment_type || "",
      device: lead.device || "",
      previousCodingExp: lead.previous_coding_experience || "",
      workshopBatch: lead.workshop_batch || "",
      changeLog: lead.change_log || [],
    }));
  },

  // CORRECTED: maps camelCase -> snake_case and uses provided id
  updateLead: async (id, updates, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");

    const backendUpdates = {};
    if (updates.status !== undefined) backendUpdates.status = updates.status;
    if (updates.remarks !== undefined) backendUpdates.remarks = updates.remarks;
    if (updates.recentCall !== undefined)
      backendUpdates.last_call = updates.recentCall;
    if (updates.nextCall !== undefined)
      backendUpdates.next_call = updates.nextCall;
    if (updates.device !== undefined) backendUpdates.device = updates.device;
    if (updates.age !== undefined) backendUpdates.age = updates.age;
    if (updates.grade !== undefined) backendUpdates.grade = updates.grade;
    if (updates.permanentAddress !== undefined)
      backendUpdates.address_line_1 = updates.permanentAddress;
    if (updates.temporaryAddress !== undefined)
      backendUpdates.address_line_2 = updates.temporaryAddress;
    if (updates.city !== undefined) backendUpdates.city = updates.city;
    if (updates.county !== undefined) backendUpdates.county = updates.county;
    if (updates.postCode !== undefined) backendUpdates.post_code = updates.postCode;
    if (updates.studentName !== undefined)
      backendUpdates.student_name = updates.studentName;
    if (updates.parentsName !== undefined)
      backendUpdates.parents_name = updates.parentsName;
    if (updates.email !== undefined) backendUpdates.email = updates.email;
    if (updates.phone !== undefined) backendUpdates.phone_number = updates.phone;
    if (updates.contactWhatsapp !== undefined)
      backendUpdates.whatsapp_number = updates.contactWhatsapp;
    if (updates.course !== undefined) backendUpdates.course = updates.course;
    if (updates.source !== undefined) backendUpdates.source = updates.source;
    if (updates.classType !== undefined)
      backendUpdates.class_type = updates.classType;
    if (updates.value !== undefined) backendUpdates.value = updates.value;
    if (updates.adsetName !== undefined)
      backendUpdates.adset_name = updates.adsetName;
    if (updates.shift !== undefined) backendUpdates.shift = updates.shift;
    if (updates.paymentType !== undefined)
      backendUpdates.payment_type = updates.paymentType;
    if (updates.previousCodingExp !== undefined)
      backendUpdates.previous_coding_experience = updates.previousCodingExp;
    if (updates.workshopBatch !== undefined)
      backendUpdates.workshop_batch = updates.workshopBatch;
    if (updates.addDate !== undefined) backendUpdates.add_date = updates.addDate;
    if (updates.changeLog !== undefined)
      backendUpdates.change_log = updates.changeLog;

    const response = await fetch(`${BASE_URL}/leads/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendUpdates),
    });

    return handleResponse(response);
  },

  addLead: async (newLeadData, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const backendData = {
      student_name: newLeadData.studentName || "",
      parents_name: newLeadData.parentsName || "",
      email: newLeadData.email || "",
      phone_number: newLeadData.phone || "",
      whatsapp_number: newLeadData.contactWhatsapp || "",
      age: newLeadData.age || "",
      grade: newLeadData.grade || "",
      course: newLeadData.course,
      source: newLeadData.source || "",
      add_date: newLeadData.addDate || "",
      last_call: newLeadData.recentCall || null,
      next_call: newLeadData.nextCall || null,
      status: newLeadData.status || "New",
      address_line_1: newLeadData.permanentAddress || "",
      address_line_2: newLeadData.temporaryAddress || "",
      city: newLeadData.city || "",
      county: newLeadData.county || "",          // ✅ fixed (was newLead.county)
      post_code: newLeadData.postCode || "",     // ✅ fixed (was newLead.postCode)
      class_type: newLeadData.classType || "",
      value: newLeadData.value || "",
      adset_name: newLeadData.adsetName || "",
      remarks: newLeadData.remarks || "",
      shift: newLeadData.shift || "",
      payment_type: newLeadData.paymentType || "",
      device: newLeadData.device || "",
      previous_coding_experience: newLeadData.previousCodingExp || "",
      workshop_batch: newLeadData.workshopBatch || "",
      change_log: newLeadData.changeLog || [],
    };
    const response = await fetch(`${BASE_URL}/leads/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
    });
    return handleResponse(response);
  },

  exportLeads: async (authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/leads/export-csv/`, {
      headers: { Authorization: `Token ${authToken}` },
    });
    if (!response.ok) throw new Error("Failed to export CSV");
    return response.blob();
  },

  /** Import ONE CSV row by posting to /leads/from/ (backend handles enrollments/trash) */
  importFromCsvRow: async (row, courses, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const payload = _csvRowToLeadPayload(row, courses);
    const response = await fetch(`${BASE_URL}/leads/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  /** Import MANY rows sequentially with optional progress callback */
  importCsvRows: async (rows, courses, authToken, onProgress) => {
    const results = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const created = await leadService.importFromCsvRow(
          rows[i],
          courses,
          authToken
        );
        results.push({ ok: true, data: created });
      } catch (e) {
        results.push({ ok: false, error: e.message, row: rows[i] });
      }
      if (onProgress) onProgress(i + 1, rows.length);
    }
    return results;
  },
};

export const enrollmentService = {
  createEnrollment: async (enrollmentData, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/enrollments/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(enrollmentData),
    });
    return handleResponse(response);
  },
};

export const trashService = {
  getTrashedLeads: async (authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/trash/`, {
      headers: { Authorization: `Token ${authToken}` },
    });
    const backendLeads = await handleResponse(response);
    return backendLeads.map((lead) => ({
      id: lead.id,
      student_name: lead.student_name || "",
      parents_name: lead.parents_name || "",
      email: lead.email || "",
      phone_number: lead.phone_number || "",
      whatsapp_number: lead.whatsapp_number || "",
      age: lead.age || "",
      grade: lead.grade || "",
      course_name: lead.course_name || "",
      source: lead.source || "",
      add_date: lead.add_date || "",
      last_call: lead.last_call || "",
      next_call: lead.next_call || "",
      status: lead.status || "Junk",
      address_line_1: lead.address_line_1 || "",
      address_line_2: lead.address_line_2 || "",
      city: lead.city || "",
      county: lead.county || "",
      post_code: lead.post_code || "",
      class_type: lead.class_type || "",
      value: lead.value || "",
      adset_name: lead.adset_name || "",
      remarks: lead.remarks || "",
      shift: lead.shift || "",
      payment_type: lead.payment_type || "",
      device: lead.device || "",
      previous_coding_experience: lead.previous_coding_experience || "",
      workshop_batch: lead.workshop_batch || "",
      changeLog: lead.change_log || [],
    }));
  },

  moveToTrash: async (leadData, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/trash/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadData),
    });
    return handleResponse(response);
  },

  deleteTrashedLead: async (id, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/trash/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${authToken}` },
    });
    if (!response.ok) {
      let errorMsg = "Failed to permanently delete lead from trash";
      try {
        const errData = await response.json();
        errorMsg = errData.detail || JSON.stringify(errData);
      } catch {
        try {
          errorMsg = await response.text();
        } catch {
          // ignore
        }
      }
      throw new Error(errorMsg);
    }
    return response;
  },
};

export const courseService = {
  getCourses: async (authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/courses/`, {
      headers: { Authorization: `Token ${authToken}` },
    });
    return handleResponse(response);
  },
};

export const changeLogService = {
  getLeadLogs: async (leadId, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/leads/${leadId}/logs/`, {
      headers: { Authorization: `Token ${authToken}` },
    });
    const logs = await handleResponse(response);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
};
