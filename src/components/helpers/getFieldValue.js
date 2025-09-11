// Helper function to get field value with fallback
const getFieldValue = (lead, fieldName) => {
  // Check snake_case first, then camelCase
  return lead[fieldName] ?? lead[fieldName.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] ?? '';
};

export default getFieldValue;
