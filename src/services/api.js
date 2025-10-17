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
  // Some endpoints may return 204 No Content — handle that gracefully.
  if (response.status === 204) return {};
  // If there's no body, return an empty object to avoid parse errors
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    // fallback to original behavior
    return text;
  }
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

// Format date for API: backend expects YYYY-MM-DD for date fields like last_call/next_call.
const formatDateForApi = (d) => {
  if (!d && d !== 0) return null;
  // Date object -> YYYY-MM-DD
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // If already a string in YYYY-MM-DD, return it
  const s = String(d).trim();
  const parts = s.split("-");
  if (parts.length === 3 && parts[0].length === 4) return s;

  // If input was in backend-old format 'YYYY|DD|MM', convert to YYYY-MM-DD
  if (s.includes("|")) {
    const parts2 = s.split("|");
    if (parts2.length === 3) {
      const [yyyy, dd, mm] = parts2;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
  }

  // Fallback: try Date parse and format
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
};

// Allowed shift choices (keeps in sync with UI options)
const allowedShifts = [
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
  // legacy/fallback short names
  "Morning",
  "Afternoon",
  "Evening",
  "Flexible",
];

// Accept free-text shift values from the UI. Backend may validate against
// allowed choices, but the UI should be able to send arbitrary text (or
// an empty string to clear). Return undefined only when the incoming value
// is strictly undefined or null; otherwise return the trimmed string.
const sanitizeShift = (s) => {
  if (s === undefined || s === null) return undefined;
  const str = String(s).trim();
  // Return empty string if user cleared the value
  return str;
};

// No aggressive normalization is performed for shift — backend expects free-text.
// We only trim the incoming value via `sanitizeShift` and send it as-is.

export const leadService = {
  getLeads: async (authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
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
    

    return leadsList.map((lead) => ({
      // Use just 'id' since that's what backend uses
      id: lead.id,
      // Provide a stable _id for UI components that expect it
      _id: lead._id || lead.id || lead.email || lead.phone_number || `lead-${lead.id}`,
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
  // Include both substatus and sub_status variants so the UI can
  // reliably read whichever naming the backend returns.
  substatus: lead.substatus || lead.sub_status || "New",
  sub_status: lead.sub_status || lead.substatus || "New",
  // Expose course_duration (backend may use snake_case or camelCase)
  course_duration: lead.course_duration || lead.courseDuration || "",
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
    if (updates.remarks !== undefined) {
      try {
        const raw = updates.remarks == null ? "" : String(updates.remarks);
        const lines = raw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        backendUpdates.remarks = lines.slice(0, 5).join("\n");
      } catch {
        // Fallback to original if any unexpected error occurs
        backendUpdates.remarks = updates.remarks;
      }
    }
    // Update call dates only when explicitly provided by caller.
    // Do not infer or auto-fill when unrelated fields (like assigned_to) change.
    // Only map/format call date fields if they are explicitly provided by caller
    if (Object.prototype.hasOwnProperty.call(updates, 'recentCall')) {
      const v = updates.recentCall;
      if (v !== undefined) backendUpdates.last_call = formatDateForApi(v);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'nextCall')) {
      const v = updates.nextCall;
      if (v !== undefined) backendUpdates.next_call = formatDateForApi(v);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'last_call')) {
      const v = updates.last_call;
      if (v !== undefined) backendUpdates.last_call = formatDateForApi(v);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'next_call')) {
      const v = updates.next_call;
      if (v !== undefined) backendUpdates.next_call = formatDateForApi(v);
    }
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
    // Accept direct snake_case for class_type from inline table editors
    if (updates.class_type !== undefined)
      backendUpdates.class_type = updates.class_type;
    // Support course_type (snake and camel)
    if (updates.course_type !== undefined)
      backendUpdates.course_type = updates.course_type;
    if (updates.courseType !== undefined)
      backendUpdates.course_type = updates.courseType;
    if (updates.value !== undefined) backendUpdates.value = updates.value;
    if (updates.adsetName !== undefined)
      backendUpdates.adset_name = updates.adsetName;
    if (updates.shift !== undefined) {
      const s = sanitizeShift(updates.shift);
      if (s !== undefined) backendUpdates.shift = s;
    }
    if (updates.paymentType !== undefined)
      backendUpdates.payment_type = updates.paymentType;
    // Support updating first_installment (numeric or null)
    if (updates.first_installment !== undefined) {
      const v = updates.first_installment;
      if (v === null || v === "") backendUpdates.first_installment = null;
      else {
        const n = Number(v);
        backendUpdates.first_installment = Number.isFinite(n) ? n : v;
      }
    }
    if (updates.firstInstallment !== undefined) {
      const v = updates.firstInstallment;
      if (v === null || v === "") backendUpdates.first_installment = null;
      else {
        const n = Number(v);
        backendUpdates.first_installment = Number.isFinite(n) ? n : v;
      }
    }
    if (updates.previousCodingExp !== undefined)
      backendUpdates.previous_coding_experience = updates.previousCodingExp;
    if (updates.workshopBatch !== undefined)
      backendUpdates.workshop_batch = updates.workshopBatch;
    if (updates.addDate !== undefined) backendUpdates.add_date = updates.addDate;
    if (updates.changeLog !== undefined)
      backendUpdates.change_log = updates.changeLog;
    // Support updating substatus (UI may send `substatus` or `sub_status`)
    // Backend expects `substatus` (no underscore) — accept either incoming
    // variant but always send `substatus` to the server.
    if (updates.substatus !== undefined) backendUpdates.substatus = updates.substatus;
    if (updates.sub_status !== undefined) backendUpdates.substatus = updates.sub_status;
    // Support updating course duration (UI may send snake_case or camelCase)
    if (updates.course_duration !== undefined)
      backendUpdates.course_duration = updates.course_duration;
    if (updates.courseDuration !== undefined)
      backendUpdates.course_duration = updates.courseDuration;
    // scheduled_taken (new) replaces legacy demo_scheduled. Accept either and send scheduled_taken.
    if (updates.scheduled_taken !== undefined)
      backendUpdates.scheduled_taken = updates.scheduled_taken;
    if (updates.scheduledTaken !== undefined)
      backendUpdates.scheduled_taken = updates.scheduledTaken;
    // Legacy support: still accept demo_scheduled fields if present
    if (backendUpdates.scheduled_taken === undefined) {
      if (updates.demo_scheduled !== undefined)
        backendUpdates.scheduled_taken = updates.demo_scheduled;
      if (updates.demoScheduled !== undefined)
        backendUpdates.scheduled_taken = updates.demoScheduled;
    }
    // Support updating assigned user (username) or assigned_to field
    if (updates.assigned_to !== undefined)
      backendUpdates.assigned_to = updates.assigned_to;
    if (updates.assigned_to_username !== undefined)
      backendUpdates.assigned_to_username = updates.assigned_to_username;

    const doPatch = async (payload) => {
      // If uploading a file for first_invoice, use multipart/form-data
      const hasInvoiceFile =
        updates && updates.first_invoice && updates.first_invoice instanceof File;

      let resp;
      if (hasInvoiceFile) {
        const fd = new FormData();
        // Append scalar fields from payload
        Object.entries(payload || {}).forEach(([k, v]) => {
          if (k === "first_invoice") return; // handle below
          if (v === undefined || v === null) return;
          if (typeof v === "object") {
            try {
              fd.append(k, JSON.stringify(v));
            } catch {
              // fall back to string
              fd.append(k, String(v));
            }
          } else {
            fd.append(k, String(v));
          }
        });
        // Append the file last
        fd.append("first_invoice", updates.first_invoice);

        resp = await fetch(`${BASE_URL}/leads/${id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${authToken}`,
            // IMPORTANT: Do not set Content-Type for FormData; browser will set boundary
          },
          body: fd,
        });
      } else {
        resp = await fetch(`${BASE_URL}/leads/${id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      // removed noisy debug logging

      // If server returned an error (e.g., 400), read the body and log full details
      if (!resp.ok) {
        let text;
        try {
          text = await resp.text();
        } catch (e) {
          text = `<could not read response body: ${e.message}>`;
        }
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
        console.error("leadService.updateLead -> PATCH failed", {
          url: `${BASE_URL}/leads/${id}/`,
          id,
          payload,
          status: resp.status,
          responseBody: parsed,
        });
        // Throw an Error with server-provided message when possible
        const errMsg = (parsed && parsed.detail) || (typeof parsed === "string" && parsed) || JSON.stringify(parsed);
        throw new Error(errMsg || `HTTP ${resp.status}`);
      }

      return await handleResponse(resp);
    };

    // Send the PATCH once with the sanitized values. The backend should accept
    // free-text shift values; do not attempt to map to a predefined choice here.
    const data = await doPatch(backendUpdates);

    // removed noisy debug logging

    // Some backends return an empty object or 204 No Content on PATCH.
    // In that case we still want the app to have the updated fields the UI sent
    // (so they persist in the UI until a fresh fetch). Merge the server
    // response with the backendUpdates we sent and ensure an `id` is present
    // so listeners can find the right row to update.
  const serverData = data && typeof data === "object" ? data : {};
  const merged = { ...(serverData || {}), ...(backendUpdates || {}) };
  // Ensure id/_id are set (use server id when available, otherwise use the id we patched)
  merged.id = serverData.id || serverData._id || id;
  merged._id = serverData._id || serverData.id || merged._id || id;

  // Never invent last_call/next_call in merged output; only keep if request or response had them
  const requestHadLast = ('recentCall' in updates) || ('last_call' in updates);
  const requestHadNext = ('nextCall' in updates) || ('next_call' in updates);
  const responseHasLast = ('last_call' in serverData);
  const responseHasNext = ('next_call' in serverData);
  if (!responseHasLast && !requestHadLast) delete merged.last_call;
  if (!responseHasNext && !requestHadNext) delete merged.next_call;

  // Normalize naming variants so UI code can read `substatus` primarily.
  merged.substatus = merged.substatus || merged.sub_status || backendUpdates.substatus || backendUpdates.sub_status || "New";
  // Keep underscore variant as alias for legacy readers
  merged.sub_status = merged.sub_status || merged.substatus;

  // Keep assigned_to and assigned_to_username in sync
  merged.assigned_to = merged.assigned_to || merged.assigned_to_username || backendUpdates.assigned_to || backendUpdates.assigned_to_username || "";
  merged.assigned_to_username = merged.assigned_to_username || merged.assigned_to || "";

  // Normalize first_installment to a number or null consistently in the merged result
  if (merged.first_installment !== undefined) {
    if (merged.first_installment === "" || merged.first_installment === null) {
      merged.first_installment = null;
    } else if (typeof merged.first_installment === "string" || typeof merged.first_installment === "number") {
      const n = Number(merged.first_installment);
      merged.first_installment = Number.isFinite(n) ? n : merged.first_installment;
    }
  }

  // Normalize course_duration variants — preserve empty string if present
  if (serverData.course_duration !== undefined) {
    merged.course_duration = serverData.course_duration;
  } else if (serverData.courseDuration !== undefined) {
    merged.course_duration = serverData.courseDuration;
  } else if (backendUpdates.course_duration !== undefined) {
    merged.course_duration = backendUpdates.course_duration;
  } else if (backendUpdates.courseDuration !== undefined) {
    merged.course_duration = backendUpdates.courseDuration;
  } else {
    merged.course_duration = merged.course_duration !== undefined ? merged.course_duration : "";
  }

  if (serverData.courseDuration !== undefined) {
    merged.courseDuration = serverData.courseDuration;
  } else if (serverData.course_duration !== undefined) {
    merged.courseDuration = serverData.course_duration;
  } else if (backendUpdates.courseDuration !== undefined) {
    merged.courseDuration = backendUpdates.courseDuration;
  } else if (backendUpdates.course_duration !== undefined) {
    merged.courseDuration = backendUpdates.course_duration;
  } else {
    merged.courseDuration = merged.courseDuration !== undefined ? merged.courseDuration : merged.course_duration || "";
  }

    try {
      // Broadcast a global event so other pages/components can update optimistically
      window.dispatchEvent(
        new CustomEvent("crm:leadUpdated", { detail: { lead: merged } })
      );

      // If the update included remarks, send a targeted event so the table
      // can update the per-row textarea (localRemarks) immediately.
      if (backendUpdates && backendUpdates.remarks !== undefined) {
        try {
          window.dispatchEvent(
            new CustomEvent("crm:remarkUpdated", {
              detail: { id: merged.id || null, remarks: backendUpdates.remarks },
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

    return merged;
  },

  addLead: async (newLeadData, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");

    // The data should already be in the correct format from the form
    // Normalize fields to backend expectations (snake_case keys).
    // Build backendData carefully and sanitize shift
    const backendData = {
      // include all provided values, we'll override specific keys below
      ...newLeadData,
      ...(newLeadData.status !== undefined ? { status: newLeadData.status } : {}),
      add_date: newLeadData.add_date || new Date().toISOString().split("T")[0],
      // last_call/next_call should be YYYY-MM-DD (convert if possible)
      last_call: formatDateForApi(newLeadData.last_call) || null,
      next_call: formatDateForApi(newLeadData.next_call) || null,
      // ensure sub_status is sent if provided under either name
      // ensure we send `substatus` (backend uses this key). Accept either
      // incoming `substatus` or `sub_status`.
      ...(newLeadData.sub_status !== undefined ? { substatus: newLeadData.sub_status } : {}),
      ...(newLeadData.substatus !== undefined ? { substatus: newLeadData.substatus } : {}),
      // course duration mapping
      ...(newLeadData.course_duration !== undefined
        ? { course_duration: newLeadData.course_duration }
        : {}),
      ...(newLeadData.courseDuration !== undefined
        ? { course_duration: newLeadData.courseDuration }
        : {}),
      // assigned username mapping
      ...(newLeadData.assigned_to_username !== undefined
        ? { assigned_to_username: newLeadData.assigned_to_username }
        : {}),
      ...(newLeadData.assigned_to !== undefined && newLeadData.assigned_to_username === undefined
        ? { assigned_to_username: newLeadData.assigned_to, assigned_to: newLeadData.assigned_to }
        : {}),
    };

    // Sanitize shift: only include if valid
    const sanitizedShift = sanitizeShift(newLeadData.shift ?? newLeadData.shift === "" ? newLeadData.shift : undefined);
    if (sanitizedShift !== undefined) {
      backendData.shift = sanitizedShift;
    } else {
      // Remove shift if explicitly invalid or blank to avoid backend 400s
      if (backendData.shift !== undefined) delete backendData.shift;
    }
    
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

// Resolve a backend server id for a lead-like object or id value.
// Preferences:
// 1. If passed a primitive string/number that looks like a real id, return it
// 2. If passed an object with `id`, return that
// 3. If passed an object with `_id` that doesn't look like a temporary UI id
//    (e.g., not starting with "lead-"), return that
// 4. Otherwise try to find a matching lead in `prevLeads` by email/phone/student_name
//    and return its id/_id if available.
export const resolveServerId = (leadOrId, prevLeads = []) => {
  if (leadOrId === null || leadOrId === undefined) return null;

  // If a primitive id was passed directly
  if (typeof leadOrId === "string" || typeof leadOrId === "number") {
    const s = String(leadOrId);
    // Treat temporary UI ids that start with 'lead-' as unresolved
    if (s.startsWith("lead-")) return null;
    // Prefer numeric ids when possible
    if (/^\d+$/.test(s)) return Number(s);
    return s;
  }

  // It's an object-like lead
  const lead = leadOrId || {};
  if (lead.id !== undefined && lead.id !== null) return lead.id;
  if (lead._id !== undefined && lead._id !== null) {
    const s = String(lead._id);
    if (!s.startsWith("lead-")) {
      // prefer numeric conversion where appropriate
      if (/^\d+$/.test(s)) return Number(s);
      return s;
    }
  }

  // Fallback: try to locate by unique fields in the previous leads list
  try {
    if (Array.isArray(prevLeads) && prevLeads.length) {
      const match = prevLeads.find((l) =>
        (l.email && lead.email && l.email === lead.email) ||
        (l.phone_number && lead.phone_number && l.phone_number === lead.phone_number) ||
        (l.phone && lead.phone && l.phone === lead.phone) ||
        (l.student_name && lead.student_name && l.student_name === lead.student_name)
      );
      if (match) {
        if (match.id !== undefined && match.id !== null) return match.id;
        if (match._id !== undefined && match._id !== null) {
          const ms = String(match._id);
          if (!ms.startsWith("lead-")) return /^\d+$/.test(ms) ? Number(ms) : ms;
          return match._id;
        }
      }
    }
  } catch (e) {
    // ignore and return null below
  }

  return null;
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

  restoreTrashedLead: async (id, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/trash/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "Active" }),
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
  
  // Update an existing course's name
  updateCourse: async (id, courseName, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/courses/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ course_name: courseName }),
    });
    return handleResponse(response);
  },

  // Delete a course by id
  deleteCourse: async (id, authToken) => {
    if (!authToken) throw new Error("Authentication token not found.");
    const response = await fetch(`${BASE_URL}/courses/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${authToken}` },
    });
    if (!response.ok) {
      let errorMsg = "Failed to delete course";
      try {
        const data = await response.json();
        errorMsg = data.detail || JSON.stringify(data);
      } catch (e) {
        try {
          errorMsg = await response.text();
        } catch {}
      }
      throw new Error(errorMsg);
    }
    // Return an empty object for consistency with handleResponse behavior
    return {};
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
