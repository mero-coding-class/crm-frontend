// client/src/services/changeLogService.js
import { API_BASE, apiJson } from "./api";

export const changeLogService = {
  async getLeadLogs(leadId, authToken) {
    // If leadId starts with 'new-', return the initial log only
    if (leadId.startsWith('new-')) {
      return [{
        action: "Created",
        timestamp: new Date().toISOString(),

        changes: "New lead created",
        user: "System"
      }];
    }

    try {
      const payload = await apiJson(`${API_BASE}/api/${leadId}/logs`, { authToken });
      const logs = Array.isArray(payload) ? payload : payload?.results || [];
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  },
};
