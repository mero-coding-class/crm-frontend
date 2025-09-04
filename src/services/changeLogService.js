// services/changeLogService.js
const API_BASE_URL = "https://crmmerocodingbackend.ktm.yetiappcloud.com/api";

export const changeLogService = {
  async getLeadLogs(leadId, authToken) {
    // GET request to fetch logs
    const response = await fetch(`${API_BASE_URL}/${leadId}/logs`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch logs.");
    }
    return response.json();
  },
  async postLogEntry(leadId, authToken, logData) {
    // POST request to create a new log entry
    const response = await fetch(`${API_BASE_URL}/${leadId}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(logData)
    });
    if (!response.ok) {
      throw new Error("Failed to post log entry.");
    }
    return response.json();
  }
};