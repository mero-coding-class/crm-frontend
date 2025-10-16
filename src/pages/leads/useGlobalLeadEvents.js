import { useEffect } from "react";
import { deduplicateLeads } from "./utils";

export default function useGlobalLeadEvents(
  authToken,
  allLeadsFullRef,
  setToast,
  handleRefresh,
  setAllLeads
) {
  useEffect(() => {
    if (!authToken) return;
    const importDebounceRef = { current: null };

    const onImported = (e) => {
      const importedCount = e?.detail?.count || e?.detail?.importedCount || 0;
      const message = importedCount > 0
        ? `Successfully imported ${importedCount} leads`
        : "CSV import completed successfully";
      setToast({ show: true, message, type: "success" });
      allLeadsFullRef.current = false;
      if (importDebounceRef.current) clearTimeout(importDebounceRef.current);
      importDebounceRef.current = setTimeout(() => handleRefresh(), 700);
    };

    const onLeadUpdated = () => {};

    const onLeadRestored = (e) => {
      try {
        const restored = e?.detail?.lead;
        if (!restored || !setAllLeads) return;
        setAllLeads((prev) => {
          const id = String(restored.id ?? restored._id ?? "");
          const filtered = (prev || []).filter(
            (l) => String(l.id ?? l._id ?? "") !== id
          );
          return deduplicateLeads([restored, ...filtered]);
        });
        setToast?.({ show: true, type: "success", message: "Lead restored and moved to top" });
      } catch (err) {
        console.warn("onLeadRestored handler failed:", err);
      }
    };

    const onEnrollmentCreated = () => {};

    window.addEventListener("crm:imported", onImported);
    window.addEventListener("crm:leadUpdated", onLeadUpdated);
    window.addEventListener("crm:leadRestored", onLeadRestored);
    window.addEventListener("crm:enrollmentCreated", onEnrollmentCreated);

    return () => {
      window.removeEventListener("crm:imported", onImported);
      window.removeEventListener("crm:leadUpdated", onLeadUpdated);
      window.removeEventListener("crm:leadRestored", onLeadRestored);
      window.removeEventListener("crm:enrollmentCreated", onEnrollmentCreated);
      if (importDebounceRef.current) clearTimeout(importDebounceRef.current);
    };
  }, [authToken, allLeadsFullRef, setToast, handleRefresh, setAllLeads]);

  // On mount, pick up any restored lead(s) persisted by TrashPage before navigation
  useEffect(() => {
    if (!authToken || !setAllLeads) return;
    try {
      const rawList = localStorage.getItem("crm:restoredLeads");
      if (rawList) {
        const arr = JSON.parse(rawList) || [];
        if (Array.isArray(arr) && arr.length) {
          setAllLeads((prev) => {
            const existing = prev || [];
            const filtered = existing.filter(
              (l) => !arr.some((r) => String(r.id ?? r._id ?? "") === String(l.id ?? l._id ?? ""))
            );
            return deduplicateLeads([...arr, ...filtered]);
          });
          setToast?.({ show: true, type: "success", message: `Restored ${arr.length} lead(s) and moved to top` });
        }
      } else {
        const raw = localStorage.getItem("crm:restoredLead");
        if (raw) {
          const restored = JSON.parse(raw);
          if (restored && typeof restored === "object") {
            setAllLeads((prev) => {
              const id = String(restored.id ?? restored._id ?? "");
              const filtered = (prev || []).filter(
                (l) => String(l.id ?? l._id ?? "") !== id
              );
              return deduplicateLeads([restored, ...filtered]);
            });
            setToast?.({ show: true, type: "success", message: "Lead restored and moved to top" });
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    } finally {
      try { localStorage.removeItem("crm:restoredLead"); } catch {}
      try { localStorage.removeItem("crm:restoredLeads"); } catch {}
    }
  }, [authToken, setAllLeads, setToast]);
}
