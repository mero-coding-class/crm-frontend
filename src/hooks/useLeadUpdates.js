// src/hooks/useLeadUpdates.js
import { useState, useCallback } from 'react';
import { UpdateHandler } from '../utils/updateHandler';

export const useLeadUpdates = (authToken, onUpdateSuccess, onUpdateError) => {
  const [updating, setUpdating] = useState(new Set());
  const [errors, setErrors] = useState({});

  const updateLead = useCallback(async (leadId, updates) => {
    setUpdating(prev => new Set([...prev, leadId]));
    setErrors(prev => ({ ...prev, [leadId]: null }));

    try {
      const updatedLead = await UpdateHandler.updateLead(
        leadId,
        updates,
        authToken,
        onUpdateSuccess
      );

      setUpdating(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });

      return updatedLead;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [leadId]: error.message || 'Failed to update lead'
      }));
      onUpdateError?.(error);
      throw error;
    } finally {
      setUpdating(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }, [authToken, onUpdateSuccess, onUpdateError]);

  const bulkUpdate = useCallback(async (leadIds, updates) => {
    leadIds.forEach(id => {
      setUpdating(prev => new Set([...prev, id]));
      setErrors(prev => ({ ...prev, [id]: null }));
    });

    try {
      const updatedLeads = await UpdateHandler.bulkUpdateLeads(
        leadIds,
        updates,
        authToken,
        onUpdateSuccess
      );

      setUpdating(new Set());
      return updatedLeads;
    } catch (error) {
      leadIds.forEach(id => {
        setErrors(prev => ({
          ...prev,
          [id]: error.message || 'Failed to update lead'
        }));
      });
      onUpdateError?.(error);
      throw error;
    } finally {
      setUpdating(new Set());
    }
  }, [authToken, onUpdateSuccess, onUpdateError]);

  return {
    updateLead,
    bulkUpdate,
    updating: Array.from(updating),
    errors,
    clearError: (leadId) => setErrors(prev => ({ ...prev, [leadId]: null }))
  };
};