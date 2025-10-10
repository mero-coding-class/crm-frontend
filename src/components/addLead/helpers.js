// Helpers for AddLeadModal: dates, small components

export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateForBackend = (d) => {
  if (!d && d !== 0) return null;
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const s = String(d).trim();
  const parts = s.split("-");
  if (parts.length === 3 && parts[0].length === 4) return s;
  if (s.includes("|")) {
    const parts2 = s.split("|");
    if (parts2.length === 3) {
      const [yyyy, dd, mm] = parts2;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

export const FieldError = ({ name, errors }) => {
  if (!errors || !errors[name]) return null;
  return (
    <p className="text-red-600 text-sm mt-1" role="alert">
      {errors[name]}
    </p>
  );
};

export const RequiredLabel = ({ field, optionalFields, children }) => (
  <>
    {children}
    {!optionalFields.has(field) && (
      <span className="text-red-600 ml-1" aria-hidden>
        *
      </span>
    )}
  </>
);
