import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { leadService } from "../services/api";
import { BASE_URL } from "../config";

// ✅ Header mapping dictionary (loose matching)
const headerMapping = {
  "Student Name": "student_name",
  "Parents Name": "parents_name",
  "Parent's Name": "parents_name",
  Email: "email",
  "Email Address": "email",
  Phone: "phone_number",
  "Phone Number": "phone_number",
  Whatsapp: "whatsapp_number",
  "WhatsApp Number": "whatsapp_number",
  Age: "age",
  Grade: "grade",
  Class: "grade",
  Source: "source",
  "Lead Source": "source",
  "Class Type": "class_type",
  // New fields
  "Assigned To": "assigned_to",
  "Assigned To Username": "assigned_to_username",
  Status: "status",
  "Sub Status": "substatus",
  SubStatus: "substatus",
  "Lead Type": "lead_type",
  "School/College Name": "school_college_name",
  "School College": "school_college_name",
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
};

const mapRowToLead = (row, headerMapLower) => {
  const leadBackend = {};
  const leadFrontend = {};

  Object.entries(row).forEach(([key, value]) => {
    if (!key) return;
    const normalized = key.trim().toLowerCase();
    const mappedKey = headerMapLower[normalized];
    if (mappedKey) {
      const val = value && String(value).trim() !== "" ? String(value).trim() : null;

      // Backend (snake_case)
      leadBackend[mappedKey] = val;

      // Frontend (camelCase)
      const frontendKey = backendToFrontendKeyMap[mappedKey] || mappedKey;
      leadFrontend[frontendKey] = val;
    }
  });

  // ✅ Provide defaults for required fields
  // Validate required fields. Backend expects these fields; skip rows that
  // are missing required data and continue with others. Default status to
  // 'Active' if not provided (backend allows Active/Converted/Lost).
  const required = [
    "student_name",
    "parents_name",
    "email",
    "phone_number",
    "whatsapp_number",
    "age",
    "grade",
    "source",
    "class_type",
    "lead_type",
  ];

  const missing = required.filter((k) => !leadBackend[k]);
  if (missing.length > 0) {
    // Mark this row as invalid by returning an object with an `error` key
    return {
      leadBackend,
      leadFrontend,
      error: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  // Default status to Active if absent
  if (!leadBackend.status) leadBackend.status = "Active";

  return { leadBackend, leadFrontend };
};

const ImportCsvButton = ({ authToken, onImported }) => {
  const [importing, setImporting] = useState(false);
  // progress percent removed per user request; keep counts
  const [progress, setProgress] = useState(0); // retained internally for some flows but UI bar will be removed
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
    setStatusMessage("Attempting backend import...");

    const backendImportUrl = `${BASE_URL}/leads/import-csv/`;
    abortControllerRef.current = new AbortController();
    isCancelledRef.current = false;

    // Try server-side import first
    if (authToken) {
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
          } catch (e) {
            console.warn("Backend returned non-JSON response for import");
          }

          console.log("✅ Backend CSV import succeeded", body);
          const created = Array.isArray(body?.created)
            ? body.created.map((c) => ({ ...c, _id: c.id || c._id }))
            : [];
          const createdCount = created.length;
          setImportedCount(createdCount);
          setTotalCount(createdCount);
          setProgress(100);
          setStatusMessage("Import successful (server-side)");
          setImporting(false);

          // Notify parent and global listeners so the leads table refreshes immediately
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

        // If backend returns non-OK, read the response and fall back
        try {
          const errBody = await resp.json();
          console.error("Backend CSV import error body:", errBody);
        } catch (e) {
          try {
            const txt = await resp.text();
            console.error("Backend CSV import error text:", txt);
          } catch (e2) {
            console.error("Backend CSV import failed with status", resp.status);
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

    // Client-side import fallback
    const headerMapLower = Object.fromEntries(
      Object.entries(headerMapping).map(([k, v]) => [k.trim().toLowerCase(), v])
    );

    Papa.parse(file, {
      header: true,
      worker: false, // disable worker to avoid DataCloneError with function cloning
      skipEmptyLines: true,
      complete: async (results) => {
        const mappedRows = results.data.map((r) =>
          mapRowToLead(r, headerMapLower)
        );

        const total = mappedRows.length;
        setTotalCount(total);
        setImportedCount(0);

        const createdLeads = [];
        const skippedRows = [];

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
          try {
            let created = null;
            try {
              created = await leadService.addLead(leadBackend, authToken);
            } catch (svcErr) {
              console.warn(
                "leadService.addLead failed, trying direct POST:",
                svcErr
              );
              if (authToken) {
                const resp2 = await fetch(`${BASE_URL}/leads/`, {
                  method: "POST",
                  headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(leadBackend),
                });
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

        console.log(
          `✅ CSV import finished. Created: ${createdLeads.length}, Skipped: ${skippedRows.length}`
        );
        if (skippedRows.length) console.table(skippedRows);
      },
    });
  };

  const cancelImport = () => {
    isCancelledRef.current = true;
    try {
      abortControllerRef.current?.abort();
    } catch (e) {}
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
