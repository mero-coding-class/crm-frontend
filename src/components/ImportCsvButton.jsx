import React, { useRef, useState } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

// --- Mocking the leadService for this example ---
// In a real application, this would be in your services/api.js file.
// The key is the bulkImportLeads function that accepts an array of leads.
const mockLeadService = {
  bulkImportLeads: async (leads, authToken) => {
    console.log(`Sending a chunk of ${leads.length} leads to the server.`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Chunk with ${leads.length} leads successfully processed.`);
        resolve({ success: true, count: leads.length });
      }, 500); // Simulate a network request delay
    });
  },
};

/** Robust CSV parser: handles quotes, commas/newlines inside quotes, and "" escapes */
function parseCsvText(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        field = "";
        if (
          row.length === 1 &&
          row[0] === "" &&
          rows.length &&
          rows[rows.length - 1].length === 0
        ) {
        }
        rows.push(row);
        row = [];
      } else if (c === "\r") {
        const next = text[i + 1];
        if (next !== "\n") {
          row.push(field);
          field = "";
          rows.push(row);
          row = [];
        }
      } else {
        field += c;
      }
    }
  }
  row.push(field);
  rows.push(row);
  const cleaned = rows.filter((r) => r.some((v) => String(v).trim() !== ""));
  if (!cleaned.length) return [];
  const headers = cleaned[0].map((h) => String(h).trim());
  const data = [];
  for (let i = 1; i < cleaned.length; i++) {
    const r = cleaned[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? String(r[idx]).trim() : "";
    });
    const allEmpty = Object.values(obj).every((v) => v === "");
    if (!allEmpty) data.push(obj);
  }
  return data;
}

async function parseCsv(file) {
  const text = await file.text();
  return parseCsvText(text);
}

// A mapping of CSV headers to the field names expected by your application
const headerMapping = {
  "First Name": "firstName",
  "Last Name": "lastName",
  Email: "email",
  "Phone Number": "phone",
  "WhatsApp Number": "whatsappNumber",
  "Mobile Telephone": "phone", // Using mobile telephone as phone
  "Last Contacted Date": "recentCall",
  "Next Call": "nextCall",
  Course: "course",
  Status: "status",
  Remarks: "remarks",
  Age: "age",
  Grade: "grade",
  "Class Type": "classType",
  Shift: "shift",
  "Laptop/PC": "device",
  "Previous Coding Experience": "previousCodingExp",
};

/**
 * Transforms a single CSV row object into the format expected by the application.
 */
function transformLeadData(csvRow, courses) {
  const newLead = {};
  for (const csvHeader in csvRow) {
    if (headerMapping[csvHeader]) {
      const appFieldName = headerMapping[csvHeader];
      newLead[appFieldName] = csvRow[csvHeader];
    }
  }

  // Combine First Name and Last Name into studentName
  newLead.studentName = `${newLead.firstName || ""} ${
    newLead.lastName || ""
  }`.trim();
  delete newLead.firstName;
  delete newLead.lastName;

  // Map the course name from CSV to the course ID if courses are available
  if (newLead.course && courses) {
    const matchedCourse = courses.find(
      (c) =>
        c.course_name.trim().toLowerCase() ===
        newLead.course.trim().toLowerCase()
    );
    if (matchedCourse) {
      newLead.course = matchedCourse.id;
    }
  }

  // Format dates
  if (newLead.recentCall) {
    newLead.recentCall = new Date(newLead.recentCall)
      .toISOString()
      .split("T")[0];
  }
  if (newLead.nextCall) {
    newLead.nextCall = new Date(newLead.nextCall).toISOString().split("T")[0];
  }

  // Ensure 'status' is not empty and is a valid value
  if (!newLead.status) {
    newLead.status = "New";
  }

  return newLead;
}

const CHUNK_SIZE = 1000; // Define the size of each data chunk, per user request.

const ImportCsvButton = ({ authToken, courses, onImported }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [failedCount, setFailedCount] = useState(0);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setSuccess(null);
    setFailedCount(0);
    setProgress({ done: 0, total: 0 });

    try {
      const rows = await parseCsv(file);
      if (!rows.length) throw new Error("No rows found in CSV.");

      // Set the total count for the progress bar
      setProgress({ done: 0, total: rows.length });

      // Transform all data rows before chunking
      const transformedLeads = rows.map((row) =>
        transformLeadData(row, courses)
      );
      let successfulLeads = 0;

      const chunks = [];
      for (let i = 0; i < transformedLeads.length; i += CHUNK_SIZE) {
        chunks.push(transformedLeads.slice(i, i + CHUNK_SIZE));
      }

      const chunkPromises = chunks.map((chunk) => {
        return mockLeadService
          .bulkImportLeads(chunk, authToken)
          .then((result) => {
            // Success: update progress and successful count
            successfulLeads += chunk.length;
            setProgress((prev) => ({
              ...prev,
              done: prev.done + chunk.length,
            }));
            return result;
          })
          .catch((chunkError) => {
            // Failure: update failed count and progress
            console.error(
              `Failed to import chunk starting with ${chunk[0]?.studentName}:`,
              chunkError
            );
            setFailedCount((prev) => prev + chunk.length);
            setProgress((prev) => ({
              ...prev,
              done: prev.done + chunk.length,
            }));
            return { success: false, count: 0, error: chunkError.message };
          });
      });

      // Wait for all promises to settle, whether they succeed or fail
      await Promise.all(chunkPromises);

      // Provide a summary message
      if (failedCount > 0) {
        setError(
          `Import completed with errors. ${successfulLeads} leads imported, ${failedCount} leads failed.`
        );
      } else {
        setSuccess("CSV imported successfully!");
      }

      // Ask parent to refresh leads
      onImported?.();
    } catch (err) {
      setError(err.message || "Failed to import CSV.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={openPicker}
        disabled={busy}
        className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
      >
        <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-2" />
        {busy
          ? `Importing ${progress.done}/${progress.total || "…"}`
          : "Import CSV"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="hidden"
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {success && <span className="text-xs text-green-600">{success}</span>}
    </div>
  );
};

export default ImportCsvButton;
