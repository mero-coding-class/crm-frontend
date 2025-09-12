// client/src/services/leadService.js
import { BASE_URL } from "../config";

const apiJson = async (url, { method = 'GET', authToken, body } = {}) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  
  if (!response.ok) {
    const text = await response.text();
    const message = `HTTP ${response.status} ${response.statusText}: ${text}`;
    console.error("API error", { url, method, status: response.status, body: text });
    throw new Error(message);
  }
  
  return response.json();
};

/** Normalize a string header to snake_case */
const norm = (s = "") =>
  s.toString().trim().toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^\w]/g, "_");

/** Map a CSV row (arbitrary headers) to your backend lead payload */
function csvRowToBackend(row, courses) {
  // Normalize keys
  const nrow = {};
  for (const [k, v] of Object.entries(row)) nrow[norm(k)] = v;

  // Resolve course → id (try course_id first; else by name)
  let courseId = nrow.course_id ?? null;
  if (!courseId && nrow.course) {
    const byName = courses?.find((c) => (c.course_name || "").toLowerCase() === String(nrow.course).toLowerCase());
    courseId = byName?.id ?? null;
  }

  // Dates: just pass through; backend can parse (YYYY-MM-DD or ISO)
  const payload = {
    student_name: nrow.student_name || nrow.student || "",
    parents_name: nrow.parents_name || nrow.parent_name || "",
    email: nrow.email || "",
    phone_number: nrow.phone_number || nrow.phone || "",
    whatsapp_number: nrow.whatsapp_number || nrow.whatsapp || "",
    age: nrow.age || "",
    grade: nrow.grade || "",
    source: nrow.source || "",
    class_type: nrow.class_type || "",
    shift: nrow.shift || "",
    previous_coding_experience: nrow.previous_coding_experience || nrow.prev_coding || "",
    device: nrow.device || "",
    status: nrow.status || "New",
    remarks: nrow.remarks || "",
    course: courseId, // backend expects id
    value: nrow.value || "",
    adset_name: nrow.adset_name || "",
    payment_type: nrow.payment_type || "",
    workshop_batch: nrow.workshop_batch || "",
    address_line_1: nrow.address_line_1 || nrow.permanent_address || "",
    address_line_2: nrow.address_line_2 || nrow.temporary_address || "",
    city: nrow.city || "",
    county: nrow.county || "",
    post_code: nrow.post_code || "",
    last_call: nrow.last_call || "",
    next_call: nrow.next_call || "",
    // change_log omitted on import
  };

  return payload;
}

export const leadService = {
  async addLead(leadData, authToken) {
    return apiJson(`${BASE_URL}/leads/`, {
      method: 'POST',
      authToken,
      body: leadData,
    });
  },

  async getLeads(authToken) {
    const response = await fetch(`${BASE_URL}/leads/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const list = await response.json();
    console.log('API Response:', list);
    
    return list.map((lead) => ({
      _id: lead.id.toString(),
      student_name: lead.student_name || "",
      parents_name: lead.parents_name || "",
      email: lead.email || "",
      phone_number: lead.phone_number || "",
      whatsapp_number: lead.whatsapp_number || "",
      age: lead.age || "",
      grade: lead.grade || "",
      course_name: lead.course_name || "",
      course: lead.course || null,
      source: lead.source || "",
      add_date: lead.add_date || "",
      last_call: lead.last_call || "",
      next_call: lead.next_call || "",
      status: lead.status || "New",
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
      change_log: lead.change_log || []
    }));
  },

  async updateLead(id, frontendUpdates, authToken) {
    const u = frontendUpdates;
    const backend = {};
    if (u.status !== undefined) backend.status = u.status;
    if (u.remarks !== undefined) backend.remarks = u.remarks;
    // Format dates to backend expected format yyyy|dd|mm
    const formatForBackend = (d) => {
      if (!d && d !== 0) return null;
      if (typeof d === "string" && d.includes("|")) return d;
      if (d instanceof Date) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}|${dd}|${mm}`;
      }
      const parts = String(d).split("-");
      if (parts.length === 3) {
        const [yyyy, mm, dd] = parts;
        return `${yyyy}|${dd}|${mm}`;
      }
      return d;
    };

    if (u.recentCall !== undefined) backend.last_call = formatForBackend(u.recentCall);
    if (u.nextCall !== undefined) backend.next_call = formatForBackend(u.nextCall);
    if (u.device !== undefined) backend.device = u.device;
  // Avoid sending null for age/grade because backend rejects null for these fields.
  // Send empty string when user clears the input so the backend treats it as blank
  // (or accepts the empty value) rather than an explicit null.
  if (u.age !== undefined) backend.age = u.age === "" ? "" : u.age;
  if (u.grade !== undefined) backend.grade = u.grade === "" ? "" : u.grade;
    if (u.permanentAddress !== undefined) backend.address_line_1 = u.permanentAddress;
    if (u.temporaryAddress !== undefined) backend.address_line_2 = u.temporaryAddress;
    if (u.city !== undefined) backend.city = u.city;
    if (u.county !== undefined) backend.county = u.county;
    if (u.postCode !== undefined) backend.post_code = u.postCode;
    if (u.studentName !== undefined) backend.student_name = u.studentName;
    if (u.parentsName !== undefined) backend.parents_name = u.parentsName;
    if (u.email !== undefined) backend.email = u.email;
    if (u.phone !== undefined) backend.phone_number = u.phone;
    if (u.contactWhatsapp !== undefined) backend.whatsapp_number = u.contactWhatsapp;
    if (u.course !== undefined) backend.course = u.course; // id
    if (u.source !== undefined) backend.source = u.source;
    if (u.classType !== undefined) backend.class_type = u.classType;
    if (u.value !== undefined) backend.value = u.value;
    if (u.adsetName !== undefined) backend.adset_name = u.adsetName;
    if (u.shift !== undefined) backend.shift = u.shift;
    if (u.paymentType !== undefined) backend.payment_type = u.paymentType;
    if (u.previousCodingExp !== undefined) backend.previous_coding_experience = u.previousCodingExp;
    if (u.workshopBatch !== undefined) backend.workshop_batch = u.workshopBatch;
    if (u.changeLog !== undefined) backend.change_log = u.changeLog;

    return apiJson(`${BASE_URL}/leads/${id}/`, {
      method: "PATCH",
      authToken,
      body: backend,
    });
  },

  /** Import one CSV row by posting to /api/leads/from/ (backend handles enrollments/trash routing) */
  async importLeadFromCsvRow(row, courses, authToken) {
    const payload = csvRowToBackend(row, courses);
    // NOTE: uses the special "from" endpoint as requested
    return apiJson(`${BASE_URL}/leads/from/`, {
      method: "POST",
      authToken,
      body: payload,
    });
  },

  /** Import many rows sequentially to show clear progress and avoid rate issues */
  async importCsvRows(rows, courses, authToken, onProgress) {
    const results = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const created = await this.importLeadFromCsvRow(rows[i], courses, authToken);
        results.push({ ok: true, data: created });
      } catch (e) {
        results.push({ ok: false, error: e.message, row: rows[i] });
      }
      if (onProgress) onProgress(i + 1, rows.length);
    }
    return results;
  },
};
