import { useEffect } from "react";

export default function useGlobalLeadEvents(authToken, allLeadsFullRef, setToast, handleRefresh) {
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
    const onLeadRestored = () => {};
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
  }, [authToken, allLeadsFullRef, setToast, handleRefresh]);
}
