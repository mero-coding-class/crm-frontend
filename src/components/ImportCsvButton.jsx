import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { leadService } from "../services/api";
import { BASE_URL } from "../config";


const USE_SERVER_IMPORT = false;

const headerMapping = {
  // Names
  "Student Name": "student_name",
  "Full Name": "student_name",
  Name: "student_name",
  Student: "student_name",
  "Parents Name": "parents_name",
  "Parent's Name": "parents_name",
  "Parent Name": "parents_name",
  "Guardian Name": "parents_name",
  // Contacts
  Email: "email",
  "Email Address": "email",
  "E-mail": "email",
  Mail: "email",
  Phone: "phone_number",
  "Phone Number": "phone_number",
  "Phone No": "phone_number",
  Mobile: "phone_number",
  "Mobile Number": "phone_number",
  "Contact Number": "phone_number",
  Whatsapp: "whatsapp_number",
  "WhatsApp Number": "whatsapp_number",
  "Whatsapp No": "whatsapp_number",
  WhatsApp: "whatsapp_number",
  "WA Number": "whatsapp_number",
  // Basics
  Age: "age",
  "Age (Years)": "age",
  Grade: "grade",
  Class: "grade",
  Year: "grade",
  Source: "source",
  "Lead Source": "source",
  "Source Channel": "source",
  "Class Type": "class_type",
  // Courses and types
  Course: "course",
  "Course Name": "course",
  Program: "course",
  "Course Type": "course_type",
  Mode: "course_type",
  "Learning Mode": "course_type",
  // Addresses
  "Address Line 1": "address_line_1",
  "Address Line 2": "address_line_2",
  City: "city",
  County: "county",
  Country: "country",
  "Post Code": "post_code",
  Postcode: "post_code",
  "Postal Code": "post_code",
  ZIP: "post_code",
  // Dates / scheduling
  "Last Call": "last_call",
  "Recent Call": "last_call",
  "Next Call": "next_call",
  "Next Call Date": "next_call",
  "Scheduled Taken": "scheduled_taken",
  Scheduled: "scheduled_taken",
  Demo: "scheduled_taken",
  "Demo Scheduled": "demo_scheduled",
  // Misc
  Device: "device",
  "Has Device": "device",
  "Previous Coding Experience": "previous_coding_experience",
  "Coding Experience": "previous_coding_experience",
  "Prev Coding": "previous_coding_experience",
  "Payment Type": "payment_type",
  "Payment Method": "payment_type",
  "Adset Name": "adset_name",
  "Ad Set": "adset_name",
  Adset: "adset_name",
  "School/College Name": "school_college_name",
  "School College": "school_college_name",
  School: "school_college_name",
  College: "school_college_name",
  // Assignment and status
  "Assigned To": "assigned_to",
  "Assigned To Username": "assigned_to_username",
  Assigned: "assigned_to_username",
  "Assigned User": "assigned_to_username",
  Status: "status",
  "Sub Status": "substatus",
  SubStatus: "substatus",
  "Lead Type": "lead_type",
  // Financials & misc
  "Deal Value": "value",
  Amount: "value",
  Value: "value",
  "Course Duration": "course_duration",
  Duration: "course_duration",
  Remarks: "remarks",
  Notes: "remarks",
  Comment: "remarks",
  "First Installment": "first_installment",
  "First Payment": "first_installment",
  "Initial Payment": "first_installment",
  "First Invoice": "first_invoice",
  Invoice: "first_invoice",
};

// ✅ Backend → Frontend key normalization
const backendToFrontendKeyMap = {
  student_name: "studentName",
  parents_name: "parentsName",
  email: "email",
  phone_number: "phone",
  whatsapp_number: "contactWhatsapp",
  age: "age",
  grade: "grade",
  source: "source",
  class_type: "classType",
  course: "course",
  course_name: "course_name",
  course_type: "courseType",
  shift: "shift",
  previous_coding_experience: "previousCodingExp",
  last_call: "lastCall",
  next_call: "nextCall",
  device: "device",
  status: "status",
  substatus: "substatus",
  remarks: "remarks",
  address_line_1: "permanentAddress",
  address_line_2: "temporaryAddress",
  city: "city",
  county: "county",
  country: "country",
  post_code: "postCode",
  lead_type: "leadType",
  value: "value",
  adset_name: "adsetName",
  course_duration: "course_duration",
  payment_type: "paymentType",
  school_college_name: "school_college_name",
  scheduled_taken: "scheduledTaken",
  first_installment: "first_installment",
  first_invoice: "first_invoice",
};

// Produce a compact, punctuation-free key for fuzzy header matching
const normKey = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s._\-()/\\]+/g, "")
    .replace(/[,:;\"'`’“”]+/g, "");

const mapRowToLead = (row, headerMapLower, headerMapNormalized) => {
  const leadBackend = {};
  const leadFrontend = {};

  Object.entries(row).forEach(([key, value]) => {
    if (!key) return;
    const normalized = key.trim().toLowerCase();
    let mappedKey = headerMapLower[normalized];
    if (!mappedKey) {
      const nk = normKey(key);
      mappedKey = headerMapNormalized[nk];
    }
    if (mappedKey) {
      let val =
        value && String(value).trim() !== "" ? String(value).trim() : null;
      // Normalize booleans for scheduled_taken/demo_scheduled
      if (mappedKey === "scheduled_taken" || mappedKey === "demo_scheduled") {
        const low = (val || "").toString().trim().toLowerCase();
        if (["yes", "y", "true", "1"].includes(low)) val = "Yes";
        else if (["no", "n", "false", "0"].includes(low)) val = "No";
      }

      // Skip nulls entirely so backend doesn't get null for optional fields
      if (val !== null) {
        // Backend (snake_case)
        leadBackend[mappedKey] = val;

        // Frontend (camelCase)
        const frontendKey = backendToFrontendKeyMap[mappedKey] || mappedKey;
        leadFrontend[frontendKey] = val;
      }
    }
  });

  // Cross-field mirroring for course values (ensure both present for display/use)
  if (leadBackend.course && !leadBackend.course_name) {
    leadBackend.course_name = leadBackend.course;
    leadFrontend.course_name = leadBackend.course;
  }
  if (leadBackend.course_name && !leadBackend.course) {
    leadBackend.course = leadBackend.course_name;
    leadFrontend.course = leadBackend.course_name;
  }

  // scheduled_taken default and legacy demo_scheduled
  if (!leadBackend.scheduled_taken && leadBackend.demo_scheduled) {
    leadBackend.scheduled_taken = leadBackend.demo_scheduled;
    leadFrontend.scheduledTaken = leadBackend.demo_scheduled;
  }
  // Don't force a backend default; only set a frontend default for display
  if (!leadBackend.scheduled_taken) {
    leadFrontend.scheduledTaken = leadFrontend.scheduledTaken ?? "No";
  }

  // ✅ Heuristics for essentials
  // Fill phone_number from whatsapp_number
  if (!leadBackend.phone_number && leadBackend.whatsapp_number) {
    leadBackend.phone_number = leadBackend.whatsapp_number;
    leadFrontend.phone = leadBackend.whatsapp_number;
  }
  // If still missing, try to detect a phone-like string from any cell
  if (!leadBackend.phone_number) {
    for (const [, v] of Object.entries(row)) {
      const str = (v ?? "").toString().trim();
      if (!str) continue;
      const digits = str.replace(/\D+/g, "");
      if (digits.length >= 8) {
        leadBackend.phone_number = str;
        leadFrontend.phone = str;
        break;
      }
    }
  }
  // Derive student_name if absent
  if (!leadBackend.student_name) {
    if (leadBackend.parents_name) {
      leadBackend.student_name = leadBackend.parents_name;
      leadFrontend.studentName = leadBackend.parents_name;
    } else {
      let guessedName = null;
      for (const [k, v] of Object.entries(row)) {
        const nk = normKey(k);
        if (/(fullname|name|student)/.test(nk) && !/parent/.test(nk)) {
          const sv = (v ?? "").toString().trim();
          if (sv) {
            guessedName = sv;
            break;
          }
        }
      }
      if (guessedName) {
        leadBackend.student_name = guessedName;
        leadFrontend.studentName = guessedName;
      } else {
        // default to Unknown if truly absent; allow phone-only rows
        leadBackend.student_name = "Unknown";
        leadFrontend.studentName = "Unknown";
      }
    }
  }

  // Require at least a phone number to create a lead
  if (!leadBackend.phone_number) {
    return {
      leadBackend,
      leadFrontend,
      error: "Missing required fields: phone_number",
    };
  }

  // Default status/substatus for frontend display only; avoid forcing in payload
  if (!leadBackend.status)
    leadFrontend.status = leadFrontend.status ?? "Active";
  if (!leadBackend.substatus)
    leadFrontend.substatus = leadFrontend.substatus ?? "New";

  return { leadBackend, leadFrontend };
};

const ImportCsvButton = ({ authToken, onImported }) => {
  const [importing, setImporting] = useState(false);
  // progress percent removed from UI; keep only setter for internal flow
  const [, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [fileName, setFileName] = useState("");

  const abortControllerRef = useRef(null);
  const isCancelledRef = useRef(false);
  // Note: avoid passing function options to Papa when worker: true to prevent DataCloneError

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name || "");
    setImporting(true);
    setProgress(0);
    setStatusMessage(
      USE_SERVER_IMPORT
        ? "Attempting backend import..."
        : "Using client-side import (server importer temporarily disabled)"
    );

    const backendImportUrl = `${BASE_URL}/leads/import-csv/`;
    abortControllerRef.current = new AbortController();
    isCancelledRef.current = false;

    // Try server-side import first
    if (authToken && USE_SERVER_IMPORT) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const resp = await fetch(backendImportUrl, {
          method: "POST",
          headers: { Authorization: `Token ${authToken}` },
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (resp.ok) {
          let body = null;
          try {
            body = await resp.json();
          } catch {
            console.debug("Server import responded without JSON body");
          }
          const created = Array.isArray(body?.created)
            ? body.created.map((c) => ({ ...c, _id: c.id || c._id }))
            : [];
          const createdCount = created.length;
          setImportedCount(createdCount);
          setTotalCount(createdCount);
          setProgress(100);
          setStatusMessage("Import successful (server-side)");
          setImporting(false);

          try {
            if (onImported) onImported(created);
          } catch (e) {
            console.warn("onImported callback failed", e);
          }
          try {
            window.dispatchEvent(
              new CustomEvent("crm:imported", { detail: { created } })
            );
          } catch (e) {
            console.warn("Failed to dispatch crm:imported event", e);
          }
          return;
        }

        try {
          const errBody = await resp.json();
          console.error("Backend CSV import error body:", errBody);
        } catch (e) {
          try {
            const txt = await resp.text();
            console.error("Backend CSV import error text:", txt, e);
          } catch (e2) {
            console.error(
              "Backend CSV import failed with status",
              resp.status,
              e2
            );
          }
        }
        console.warn(
          "Backend CSV import failed, falling back to client-side import",
          resp.status
        );
        setStatusMessage(
          "Backend import failed; falling back to client-side import..."
        );
        setProgress(10);
      } catch (err) {
        console.warn("Backend import attempt failed:", err);
        setStatusMessage(
          "Backend import attempt failed; using client-side fallback"
        );
        setProgress(10);
      }
    }

    // Client-side import (primary path while server importer is disabled)
    const headerMapLower = Object.fromEntries(
      Object.entries(headerMapping).map(([k, v]) => [k.trim().toLowerCase(), v])
    );
    const headerMapNormalized = Object.fromEntries(
      Object.entries(headerMapping).map(([k, v]) => [normKey(k), v])
    );

    Papa.parse(file, {
      header: true,
      worker: false, // disable worker to avoid DataCloneError with function cloning
      skipEmptyLines: true,
      complete: async (results) => {
        const mappedRows = results.data.map((r) =>
          mapRowToLead(r, headerMapLower, headerMapNormalized)
        );

        const total = mappedRows.length;
        setTotalCount(total);
        setImportedCount(0);

        const createdLeads = [];
        const skippedRows = [];

        // helper: attempt to turn an invoice URL or data URI string into a File
        const toFileFromInvoice = async (invoiceValue) => {
          try {
            if (!invoiceValue || typeof invoiceValue !== "string") return null;
            const url = invoiceValue.trim();
            // data URI
            if (url.startsWith("data:")) {
              const arr = url.split(",");
              const mime =
                arr[0].split(":")[1].split(";")[0] ||
                "application/octet-stream";
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              const blob = new Blob([u8arr], { type: mime });
              const ext = mime.includes("pdf")
                ? "pdf"
                : mime.split("/")[1] || "bin";
              return new File([blob], `invoice.${ext}`, { type: mime });
            }
            // http(s) url: fetch and convert to File
            const resp = await fetch(url, {
              headers: authToken
                ? { Authorization: `Token ${authToken}` }
                : undefined,
            });
            if (!resp.ok) return null;
            const ct =
              resp.headers.get("content-type") || "application/octet-stream";
            const blob = await resp.blob();
            // try to infer name from URL path
            const nameMatch =
              url.split("?")[0].split("#")[0].split("/").pop() || "invoice";
            return new File([blob], nameMatch, { type: ct });
          } catch (e) {
            console.debug("toFileFromInvoice failed", e);
            return null;
          }
        };

        for (let i = 0; i < mappedRows.length; i++) {
          if (isCancelledRef.current) break;
          const row = mappedRows[i];
          setProgress(Math.round(((i + 1) / Math.max(1, total)) * 100));

          if (row.error) {
            console.warn(`Skipping row ${i + 1}: ${row.error}`);
            skippedRows.push({ row: i + 1, reason: row.error });
            continue;
          }

          const { leadBackend, leadFrontend } = row;
          // Filter out null/empty values to avoid sending nulls
          const sanitizedPayload = Object.fromEntries(
            Object.entries(leadBackend).filter(
              ([, v]) =>
                v !== null && v !== undefined && String(v).trim() !== ""
            )
          );
          // If first_invoice is a URL/data URI string, try to convert to a File
          let invoiceFile = null;
          if (typeof sanitizedPayload.first_invoice === "string") {
            invoiceFile = await toFileFromInvoice(
              sanitizedPayload.first_invoice
            );
            if (invoiceFile) {
              // backend expects file upload; avoid sending string in JSON
              delete sanitizedPayload.first_invoice;
            }
          }
          try {
            let created = null;
            try {
              // When we have an invoice File, use multipart path via leadService.addLead
              if (invoiceFile) {
                created = await leadService.addLead(
                  { ...sanitizedPayload, first_invoice: invoiceFile },
                  authToken
                );
              } else {
                created = await leadService.addLead(
                  sanitizedPayload,
                  authToken
                );
              }
            } catch (svcErr) {
              console.warn(
                "leadService.addLead failed, trying direct POST:",
                svcErr
              );
              if (authToken) {
                let resp2;
                if (invoiceFile) {
                  const fd = new FormData();
                  Object.entries(sanitizedPayload).forEach(([k, v]) => {
                    if (v !== null && v !== undefined) fd.append(k, v);
                  });
                  fd.append("first_invoice", invoiceFile);
                  resp2 = await fetch(`${BASE_URL}/leads/`, {
                    method: "POST",
                    headers: { Authorization: `Token ${authToken}` },
                    body: fd,
                  });
                } else {
                  resp2 = await fetch(`${BASE_URL}/leads/`, {
                    method: "POST",
                    headers: {
                      Authorization: `Token ${authToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(sanitizedPayload),
                  });
                }
                if (!resp2.ok) {
                  const txt = await resp2.text();
                  throw new Error(`Direct POST failed: ${resp2.status} ${txt}`);
                }
                created = await resp2.json();
              } else {
                throw svcErr;
              }
            }

            createdLeads.push({
              ...leadFrontend,
              _id: created.id || created._id,
            });
            setImportedCount((c) => c + 1);
          } catch (err) {
            console.error(`❌ Failed to create row ${i + 1}:`, err);
            skippedRows.push({
              row: i + 1,
              reason: err.message || String(err),
            });
          }
        }

        if (isCancelledRef.current) {
          setStatusMessage(
            `Import cancelled. Created: ${createdLeads.length}, Skipped: ${skippedRows.length}`
          );
        } else {
          setStatusMessage(
            `Import finished. Created: ${createdLeads.length}, Skipped: ${skippedRows.length}`
          );
        }
        setProgress(100);
        setImporting(false);

        // Notify listeners to refresh leads immediately (even if zero created)
        try {
          if (onImported) onImported(createdLeads);
        } catch (e) {
          console.warn("onImported callback failed", e);
        }
        try {
          window.dispatchEvent(
            new CustomEvent("crm:imported", {
              detail: { created: createdLeads },
            })
          );
        } catch (e) {
          console.warn("Failed to dispatch crm:imported event", e);
        }

        // removed noisy import summary logs
      },
    });
  };

  const cancelImport = () => {
    isCancelledRef.current = true;
    try {
      abortControllerRef.current?.abort();
    } catch (e) {
      console.debug("Abort failed or not needed", e);
    }
    setImporting(false);
    setStatusMessage("Import cancelled by user");
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="csvUpload"
        disabled={importing}
      />
      <label
        htmlFor="csvUpload"
        className={`cursor-pointer px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 shadow-sm ${
          importing ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        Import CSV
      </label>

      {fileName && (
        <div className="mt-2 text-sm text-gray-700">File: {fileName}</div>
      )}

      {importing && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Imported {importedCount} / {totalCount}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={cancelImport}
                className="text-sm text-red-600 hover:underline ml-2"
              >
                Cancel
              </button>
            </div>
          </div>
          {statusMessage && (
            <div className="text-sm text-gray-600 mt-1">{statusMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportCsvButton;
