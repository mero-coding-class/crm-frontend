// src/components/ImportCsvButton.jsx
import React, { useRef, useState } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { leadService } from "../services/api";

/** Robust CSV parser: handles quotes, commas/newlines inside quotes, and "" escapes */
function parseCsvText(text) {
  // Remove BOM if present
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
          // Escaped quote
          field += '"';
          i++;
        } else {
          // End quoted field
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
        // Skip \r just before \n (Windows line endings)
        if (
          row.length === 1 &&
          row[0] === "" &&
          rows.length &&
          rows[rows.length - 1].length === 0
        ) {
          // ignore stray blank line
        }
        rows.push(row);
        row = [];
      } else if (c === "\r") {
        // If CRLF, the \n case will handle row push
        // If lone \r, treat as newline
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

  // flush last field/row
  row.push(field);
  rows.push(row);

  // Trim trailing completely empty rows
  const cleaned = rows.filter((r) => r.some((v) => String(v).trim() !== ""));

  if (!cleaned.length) return [];

  // First row as header
  const headers = cleaned[0].map((h) => String(h).trim());
  const data = [];

  for (let i = 1; i < cleaned.length; i++) {
    const r = cleaned[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? String(r[idx]).trim() : "";
    });
    // skip rows that are entirely empty (after header)
    const allEmpty = Object.values(obj).every((v) => v === "");
    if (!allEmpty) data.push(obj);
  }

  return data;
}

async function parseCsv(file) {
  const text = await file.text();
  return parseCsvText(text);
}

const ImportCsvButton = ({ authToken, courses, onImported }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: 0 });

    try {
      const rows = await parseCsv(file);
      if (!rows.length) throw new Error("No rows found in CSV.");

      await leadService.importCsvRows(rows, courses, authToken, (done, total) =>
        setProgress({ done, total })
      );

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
    </div>
  );
};

export default ImportCsvButton;
