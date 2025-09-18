// src/utils/updateHandler.js
import { BASE_URL } from '../config';

export class UpdateHandler {
  static async updateLead(leadId, updates, authToken, optimisticUpdate) {
    try {
      // First, call the optimistic update callback
      if (optimisticUpdate) {
        optimisticUpdate(updates);
      }

      // Make the API call
      const response = await fetch(`${BASE_URL}/leads/${leadId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      const updatedLead = await response.json();

      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('crm:leadUpdated', {
        detail: { lead: updatedLead }
      }));

      return updatedLead;
    } catch (error) {
      // If there's an error, we need to rollback the optimistic update
      if (optimisticUpdate) {
        optimisticUpdate(null, true); // true indicates rollback
      }
      throw error;
    }
  }

  static async bulkUpdateLeads(leadIds, updates, authToken, optimisticUpdate) {
    try {
      // Optimistically update all leads
      if (optimisticUpdate) {
        leadIds.forEach(id => optimisticUpdate(id, updates));
      }

      // Make the API call
      const response = await fetch(`${BASE_URL}/leads/bulk-update/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({
          lead_ids: leadIds,
          updates: updates
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update leads');
      }

      const updatedLeads = await response.json();

      // Notify about each updated lead
      updatedLeads.forEach(lead => {
        window.dispatchEvent(new CustomEvent('crm:leadUpdated', {
          detail: { lead }
        }));
      });

      return updatedLeads;
    } catch (error) {
      // Rollback all optimistic updates
      if (optimisticUpdate) {
        leadIds.forEach(id => optimisticUpdate(id, null, true));
      }
      throw error;
    }
  }
}