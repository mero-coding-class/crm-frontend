import React from "react";
import Papa from "papaparse";
import { leadService } from "../services/api";

// ✅ Header mapping dictionary
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

const mapRowToLead = (row) => {
  const leadBackend = {};
  const leadFrontend = {};

  Object.entries(row).forEach(([key, value]) => {
    const mappedKey = headerMapping[key.trim()];
    if (mappedKey) {
      const val = value && value.trim() !== "" ? value.trim() : null;

      // ✅ Backend (snake_case)
      leadBackend[mappedKey] = val;

      // ✅ Frontend (camelCase)
      const frontendKey = backendToFrontendKeyMap[mappedKey] || mappedKey;
      leadFrontend[frontendKey] = val;
    }
  });

  // ✅ Provide defaults for required fields
  if (!leadBackend.source) {
    leadBackend.source = "Other"; // must match allowed backend choice
    leadFrontend.source = "Other";
  }
  if (!leadBackend.class_type) {
    leadBackend.class_type = "General"; // must match allowed backend choice
    leadFrontend.classType = "General";
  }

  return { leadBackend, leadFrontend };
};

const ImportCsvButton = ({ authToken, onImported }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const mappedRows = results.data.map(mapRowToLead);

        const createdLeads = [];
        for (const { leadBackend, leadFrontend } of mappedRows) {
          try {
            const created = await leadService.addLead(leadBackend, authToken);
            // ✅ merge backend id into frontend object
            createdLeads.push({
              ...leadFrontend,
              _id: created.id || created._id,
            });
          } catch (err) {
            console.error("❌ Failed to create lead:", err);
          }
        }

        if (onImported && createdLeads.length > 0) {
          onImported(createdLeads);
        }

        console.log("✅ CSV import finished");
      },
    });
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="csvUpload"
      />
      <label
        htmlFor="csvUpload"
        className="cursor-pointer px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
      >
        Import CSV
      </label>
    </div>
  );
};

export default ImportCsvButton;
