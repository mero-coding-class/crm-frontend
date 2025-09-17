// src/services/api.js

import { BASE_URL } from "../config";

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
    // Format date from 'YYYY-MM-DD' or Date to 'YYYY|DD|MM' is handled by helper below
    previous_coding_experience:
      nrow.previous_coding_experience || nrow.prev_coding || "",
    workshop_batch: nrow.workshop_batch || "",
    // change_log intentionally omitted on import
  };
};

// Format date from 'YYYY-MM-DD' or Date to 'YYYY|DD|MM'
const formatDateForBackend = (d) => {
  if (!d && d !== 0) return null;
  // If already in backend format, return as-is
  if (typeof d === "string" && d.includes("|")) return d;

  // Date object
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}|${dd}|${mm}`;
  }

  // String in YYYY-MM-DD
  const s = String(d);
  const parts = s.split("-");
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${yyyy}|${dd}|${mm}`;
  }

  // Fallback: return original string
  return s;
};

export const leadService = {
  getLeads: async (authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    console.log('Fetching leads from:', `${BASE_URL}/leads/`);
    const response = await fetch(`${BASE_URL}/leads/`, {
      headers: { 
        'Authorization': `Token ${authToken}`,
        'Content-Type': 'application/json'
      },
    });
    const backendLeads = await handleResponse(response);
    // Normalize backend response to an array. Some backends return
    // a paginated object like { results: [...] } while others return []
    const leadsList = Array.isArray(backendLeads)
      ? backendLeads
      : backendLeads?.results || [];
    console.log('Backend Leads Response:', backendLeads);

    // Log any leads with course information (format dates for readability)
    leadsList.forEach((lead) => {
      if (lead.course || lead.course_name) {
        console.log("Lead with course info:", {
          last_call: formatDateForBackend(lead.last_call) || null,
          next_call: formatDateForBackend(lead.next_call) || null,
          course_name: lead.course_name,
        });
      }
    });

    return leadsList.map((lead) => ({
      // Use just 'id' since that's what backend uses
      id: lead.id,
      student_name: lead.student_name || "",
      parents_name: lead.parents_name || "",
      phone_number: lead.phone_number || "",
      whatsapp_number: lead.whatsapp_number || "",
      // Directly use the course_name from the backend
      course_name: lead.course_name,
  // Keep course reference as is
  course: lead.course,
      email: lead.email || "",
  age: lead.age || "",
  grade: lead.grade || "",
  // Preserve backend status (fall back to 'New' if not provided)
  status: lead.status || "New",

  // Ensure assignment fields are passed through so the UI shows who a
  // lead is assigned to. Different backend versions use `assigned_to`
  // or `assigned_to_username` — include both.
  assigned_to: lead.assigned_to || lead.assigned_to_username || "",
  assigned_to_username: lead.assigned_to_username || lead.assigned_to || "",
  // Also include substatus and lead_type if backend provides them
  substatus: lead.substatus || lead.sub_status || "New",
  lead_type: lead.lead_type || lead.leadType || "",
  school_college_name: lead.school_college_name || "",

  studentName: lead.student_name || "",
      parentsName: lead.parents_name || "",
      email: lead.email || "",
      phone: lead.phone_number || "",
      contactWhatsapp: lead.whatsapp_number || "",
      age: lead.age || "",
      grade: lead.grade || "",
      source: lead.source || "",
      // Note: last_call/next_call are available on lead as lead.last_call / lead.next_call
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

  updateLead: async (id, updates, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");

    const backendUpdates = {};
    if (updates.status !== undefined) backendUpdates.status = updates.status;
    if (updates.remarks !== undefined) backendUpdates.remarks = updates.remarks;
    if (updates.recentCall !== undefined)
      backendUpdates.last_call = formatDateForBackend(updates.recentCall);
    if (updates.nextCall !== undefined)
      backendUpdates.next_call = formatDateForBackend(updates.nextCall);
    if (updates.device !== undefined) backendUpdates.device = updates.device;
    // Avoid sending null for age/grade (backend rejects null). Send empty string
    // when the user clears the field so server receives a blank value instead
    // of an explicit null.
    if (updates.age !== undefined)
      backendUpdates.age = updates.age === "" ? "" : updates.age;
    if (updates.grade !== undefined)
      backendUpdates.grade = updates.grade === "" ? "" : updates.grade;
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
    if (updates.course_name !== undefined) backendUpdates.course_name = updates.course_name;
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
    // Support updating assigned user (username) or assigned_to field
    if (updates.assigned_to !== undefined)
      backendUpdates.assigned_to = updates.assigned_to;
    if (updates.assigned_to_username !== undefined)
      backendUpdates.assigned_to_username = updates.assigned_to_username;

    const response = await fetch(`${BASE_URL}/leads/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendUpdates),
    });

    // Wait for the parsed JSON so we can broadcast the updated lead to the app
    const data = await handleResponse(response);

    try {
      // Broadcast a global event so other pages/components can update optimistically
      window.dispatchEvent(
        new CustomEvent("crm:leadUpdated", { detail: { lead: data } })
      );

      // If the update included remarks, send a targeted event so the table
      // can update the per-row textarea (localRemarks) immediately.
      if (backendUpdates && backendUpdates.remarks !== undefined) {
        try {
          window.dispatchEvent(
            new CustomEvent("crm:remarkUpdated", {
              detail: { id: data.id || data._id || null, remarks: backendUpdates.remarks },
            })
          );
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // If window or CustomEvent is not available (e.g., SSR), ignore silently
      console.warn("Could not dispatch crm:leadUpdated event", e);
    }

    return data;
  },

  addLead: async (newLeadData, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");

    // The data should already be in the correct format from the form
    const backendData = {
      ...newLeadData,
      // Preserve status only if provided by caller. Do NOT force a default
      // value here because the backend enforces allowed choices (Active/Converted/Lost).
      ...(newLeadData.status !== undefined ? { status: newLeadData.status } : {}),
      add_date: newLeadData.add_date || new Date().toISOString().split('T')[0],
      last_call: newLeadData.last_call || null,
      next_call: newLeadData.next_call || null
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

  /**
   * 👇 NEW FUNCTION: Bulk import a list of leads in one go.
   * This is much more efficient than importing one by one.
   *
   * @param {Array<object>} leads - An array of lead objects, already
   * transformed to the backend's format (snake_case).
   * @param {string} authToken - The user's authentication token.
   * @returns {Promise<object>} - The response from the backend.
   */
  bulkImportLeads: async (leads, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/leads/bulk-import/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leads),
    });
    return handleResponse(response);
  },

  // The following functions are no longer needed as we are using a
  // bulk import endpoint.
  //
  // importFromCsvRow: async (row, courses, authToken) => { ... },
  // importCsvRows: async (rows, courses, authToken, onProgress) => { ... },
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
  const list = Array.isArray(backendLeads) ? backendLeads : backendLeads?.results || [];
  return list.map((lead) => ({
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

  // ✅ NEW: create a single course
  createCourse: async (courseName, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/courses/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ course_name: courseName }),
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
    const payload = await handleResponse(response);
    const logs = Array.isArray(payload) ? payload : payload?.results || [];
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
};
