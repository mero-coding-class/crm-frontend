import { useCallback, useState } from "react";
import { BASE_URL } from "../../config";

export default function useEnrollmentExport(authToken) {
  const [exporting, setExporting] = useState(false);

  const handleExportEnrollments = useCallback(
    async ({ searchQuery, searchLastPaymentDate, filterPaymentNotCompleted, filterScheduledTaken }) => {
      if (!authToken || exporting) return;
      setExporting(true);
      try {
        const baseParams = new URLSearchParams();
        if (searchQuery && searchQuery.trim()) baseParams.append("search", searchQuery.trim());
        if (searchLastPaymentDate && searchLastPaymentDate.trim()) baseParams.append("last_pay_date", searchLastPaymentDate.trim());
        if (filterPaymentNotCompleted) baseParams.append("payment_completed", "false");
        if (filterScheduledTaken && (filterScheduledTaken === "Yes" || filterScheduledTaken === "No")) {
          baseParams.append("scheduled_taken", filterScheduledTaken === "Yes" ? "true" : "false");
        }

        let page = 1;
        const pageSize = 100;
        let all = [];
        while (true) {
          const params = new URLSearchParams(baseParams.toString());
          params.set("page", String(page));
          params.set("page_size", String(pageSize));
          const url = `${BASE_URL}/enrollments/?${params.toString()}`;
          const resp = await fetch(url, {
            headers: { Authorization: `Token ${authToken}` },
            credentials: "include",
          });
          if (!resp.ok) throw new Error(`Failed to fetch enrollments: ${resp.status}`);
          const json = await resp.json();
          let list = [];
          let count = null;
          if (Array.isArray(json)) list = json;
          else if (Array.isArray(json.results)) { list = json.results; count = json.count ?? null; }
          else if (Array.isArray(json.data)) list = json.data;
          all = all.concat(list || []);
          if (count != null) {
            const pages = Math.max(1, Math.ceil(count / pageSize));
            if (page >= pages) break;
          } else {
            if (!list || list.length < pageSize) break;
          }
          page += 1;
        }

        if (!all || all.length === 0) throw new Error("No enrollments to export");

        const columns = [
          "id","student_name","parents_name","email","phone_number","course","batchname","assigned_teacher","scheduled_taken","payment_type","total_payment","first_installment","second_installment","third_installment","last_pay_date","payment_completed","starting_date","created_at","updated_at","invoice","remarks"
        ];
        const escapeCsv = (v) => {
          if (v === null || v === undefined) return "";
          let s = String(v);
          if (Array.isArray(v)) s = v.map((i) => i.name || i.url || "").join(" | ");
          if (s.includes(",") || s.includes("\n") || s.includes('"')) s = '"' + s.replace(/"/g, '""') + '"';
          return s;
        };
        const rows = [columns.join(",")];
        all.forEach((r) => {
          const row = columns.map((c) => {
            if (r[c] === undefined && r.lead && r.lead[c] !== undefined) return escapeCsv(r.lead[c]);
            return escapeCsv(r[c]);
          });
          rows.push(row.join(","));
        });
        const csv = rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "enrollments-export.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        setExporting(false);
      }
    },
    [authToken, exporting]
  );

  return { exporting, handleExportEnrollments };
}
