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

      // Side-effects: when status changes, call corresponding APIs immediately
      try {
        const newStatus = (updates && updates.status) || updatedLead.status;
        if (newStatus === 'Converted') {
          // Build minimal enrollment payload. first_installment remains on lead.
          const courseVal = updatedLead.course;
          const resolvedCourseId =
            typeof courseVal === 'number'
              ? courseVal
              : (typeof courseVal === 'string' && /^\d+$/.test(courseVal))
              ? parseInt(courseVal, 10)
              : null;
          const enrollmentPayload = {
            lead: updatedLead.id || leadId,
            course: resolvedCourseId,
            total_payment: updatedLead.value ?? null,
            second_installment: null,
            third_installment: null,
            batchname: '',
            last_pay_date: null,
            payment_completed: false,
            starting_date: null,
            assigned_teacher: '',
          };
          const enrollResp = await fetch(`${BASE_URL}/enrollments/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(enrollmentPayload),
          });
          if (enrollResp.ok) {
            const created = await enrollResp.json();
            window.dispatchEvent(
              new CustomEvent('crm:enrollmentCreated', { detail: { enrollment: created } })
            );
            window.dispatchEvent(
              new CustomEvent('crm:leadConverted', {
                detail: { leadId: updatedLead.id || leadId, enrollment: created },
              })
            );
          } else {
            // Fall back to triggering a refresh if API shape differs
            try {
              const t = await enrollResp.text();
              console.warn('Enrollment POST failed (fallback to refresh):', t);
            } catch {}
            window.dispatchEvent(new CustomEvent('crm:refreshEnrollments'));
          }
        } else if (newStatus === 'Lost') {
          const trashId = updatedLead.id || leadId;
          const trashResp = await fetch(`${BASE_URL}/trash/${trashId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify({ status: 'Lost' }),
          });
          if (trashResp.ok) {
            const trashed = await trashResp.json();
            window.dispatchEvent(
              new CustomEvent('crm:leadMovedToTrash', { detail: { lead: trashed, leadId: trashId } })
            );
          } else {
            try {
              const t = await trashResp.text();
              console.warn('Trash PATCH failed:', t);
            } catch {}
            window.dispatchEvent(
              new CustomEvent('crm:leadMovedToTrash', { detail: { leadId: trashId } })
            );
          }
        }
      } catch (e) {
        console.warn('Status side-effects failed:', e);
      }

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