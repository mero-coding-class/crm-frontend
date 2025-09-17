// client/src/services/changeLogService.js
import { BASE_URL } from "../config";

const apiJson = async (url, { method = "GET", authToken, body } = {}) => {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Token ${authToken}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    credentials: "include",
  });

  if (!response.ok) {
    let text = await response.text();
    try {
      const json = JSON.parse(text);
      text = json.detail || JSON.stringify(json);
    } catch {}
    throw new Error(text || response.statusText);
  }
  return response.json();
};

export const changeLogService = {
  async getLeadLogs(leadId, authToken) {
    // If leadId starts with 'new-', return the initial log only
    if (String(leadId).startsWith("new-")) {
      return [
        {
          action: "Created",
          timestamp: new Date().toISOString(),
          changes: "New lead created",
          user: "System",
        },
      ];
    }

    try {
      const payload = await apiJson(`${BASE_URL}/${leadId}/logs`, {
        authToken,
      });
      const logs = Array.isArray(payload) ? payload : payload?.results || [];
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
  },
};
