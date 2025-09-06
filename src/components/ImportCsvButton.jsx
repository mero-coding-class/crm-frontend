import React, { useState, useRef } from "react";
import Papa from "papaparse";
import moment from "moment";
import { XIcon } from "lucide-react";

const CHUNK_SIZE = 500;
const CONCURRENCY = 10;

const apiFetch = async (url, method, body, authToken) => {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }
  return res.json();
};

const ImportCsvButton = ({
  authToken,
  courses,
  onImported,
  onOptimisticAdd,
}) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  // keep a ref for cancellation
  const cancelRef = useRef(false);

  const validShifts = [
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
  ];

  const validDevices = ["Yes", "No"];

  const getCourseId = (courseName) => {
    const found = courses.find(
      (c) => c.course_name.toLowerCase() === courseName?.toLowerCase()
    );
    return found ? found.id : null;
  };

  const mapShift = (rawShift) => {
    if (validShifts.includes(rawShift)) return rawShift;

    if (/morning/i.test(rawShift)) return "7 A.M. - 9 A.M.";
    if (/afternoon/i.test(rawShift)) return "2 P.M. - 4 P.M.";
    if (/evening/i.test(rawShift)) return "6 P.M. - 8 P.M.";

    return validShifts[0];
  };

  const mapDevice = (rawDevice) => {
    if (validDevices.includes(rawDevice)) return rawDevice;
    if (/laptop|pc|computer|desktop|tablet|mobile/i.test(rawDevice))
      return "Yes";
    return "No";
  };

  const transformRow = (row) => {
    const shift = mapShift(row["shift"]?.trim() || "");
    const device = mapDevice(row["device"]?.trim() || "");

    return {
      student_name: row["student_name"]?.trim() || "Unknown Student",
      parents_name: row["parents_name"]?.trim() || "Unknown Parent",
      email: row["email"]?.trim() || "unknown@example.com",
      phone_number: row["phone_number"]?.trim() || "0000000000",
      whatsapp_number: row["whatsapp_number"]?.trim() || "0000000000",
      grade: row["grade"]?.trim() || "1",
      source: row["source"]?.trim() || "Website",
      shift,
      device,
      class_type: row["class_type"]?.trim() || "Physical",
      remarks: row["remarks"]?.trim() || "Imported via CSV",
      age: row["age"]?.trim() || "10",
      status: row["status"]?.trim() || "New",
      value: row["value"] ? Number(row["value"]) : 100,
      last_call: row["last_call"]
        ? moment(row["last_call"], [
            "MM/DD/YYYY",
            "YYYY-MM-DD",
            "DD-MM-YYYY",
          ]).isValid()
          ? moment(row["last_call"]).format("YYYY-MM-DD")
          : null
        : null,
      next_call: row["next_call"]
        ? moment(row["next_call"], [
            "MM/DD/YYYY",
            "YYYY-MM-DD",
            "DD-MM-YYYY",
          ]).isValid()
          ? moment(row["next_call"]).format("YYYY-MM-DD")
          : null
        : null,
      course: getCourseId(row["course"]) || null,
      address_line_1: row["address_line_1"]?.trim() || "",
      address_line_2: row["address_line_2"]?.trim() || "",
      city: row["city"]?.trim() || "",
      county: row["county"]?.trim() || "",
      post_code: row["post_code"]?.trim() || "",
      previous_coding_experience:
        row["previous_coding_experience"]?.trim() || "None",
      payment_type: row["payment_type"]?.trim() || "Cash",
    };
  };

  const createLead = async (row) => {
    if (cancelRef.current) return null; // stop if cancelled
    const payload = transformRow(row);
    try {
      const saved = await apiFetch(
        "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/leads/",
        "POST",
        payload,
        authToken
      );
      if (onOptimisticAdd) onOptimisticAdd(saved);
      setImported((prev) => {
        const newCount = prev + 1;
        setProgress((newCount / total) * 100);
        return newCount;
      });
      return saved;
    } catch (err) {
      console.error("❌ Lead creation failed:", err.message);
      setImported((prev) => {
        const newCount = prev + 1;
        setProgress((newCount / total) * 100);
        return newCount;
      });
      return { ...payload, error: true };
    }
  };

  const runWithConcurrency = async (tasks, concurrency) => {
    const results = [];
    let index = 0;
    const worker = async () => {
      while (index < tasks.length && !cancelRef.current) {
        const i = index++;
        results[i] = await tasks[i]();
      }
    };
    await Promise.all(Array(concurrency).fill(0).map(worker));
    return results;
  };

  const processInChunks = async (rows) => {
    setTotal(rows.length);
    setImported(0);
    setProgress(0);

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      if (cancelRef.current) break;
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const tasks = chunk.map((row) => () => createLead(row));
      await runWithConcurrency(tasks, CONCURRENCY);
      console.log(`✅ Imported chunk ${i / CHUNK_SIZE + 1}`);
    }

    if (!cancelRef.current && onImported) onImported();
    setBusy(false);
    setCancelled(false);
  };

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setBusy(true);
    cancelRef.current = false;
    setCancelled(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        await processInChunks(results.data);
      },
    });
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setCancelled(true);
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <label className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition cursor-pointer">
        Import CSV
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={busy}
          className="hidden"
        />
      </label>

      {busy && (
        <div className="space-y-2">
          {/* progress bar with smooth animation */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-green-500 h-4 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {imported}/{total} leads imported ({progress.toFixed(1)}%)
            </p>
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-800"
              title="Cancel Import"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {cancelled && <p className="text-sm text-red-600">🚫 Import cancelled</p>}
    </div>
  );
};

export default ImportCsvButton;
