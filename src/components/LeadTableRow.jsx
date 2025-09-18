import React, { useState } from 'react';
import { StatusBadge } from './common/StatusBadge';
import { useLeadUpdates } from '../hooks/useLeadUpdates';
import { Toast } from './common/Toast';

export const LeadTableRow = ({ 
  lead, 
  columns,
  onDelete,
  onEdit,
  isSelected,
  onSelect,
  authToken,
  onUpdateSuccess,
  isUpdating,
  error,
  onClearError
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { updateLead, updating, errors } = useLeadUpdates(
    authToken,
    (updates) => {
      onUpdateSuccess?.(lead.id, updates);
      setToastMessage('Updated successfully');
      setShowToast(true);
    },
    (error) => {
      setToastMessage(error.message || 'Update failed');
      setShowToast(true);
    }
  );

  const handleFieldChange = async (field, value) => {
    try {
      await updateLead(lead.id, { [field]: value });
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const renderCell = (key) => {
    const value = lead[key];
    
    switch (key) {
      case 'status':
        return (
          <StatusBadge 
            status={value} 
            onChange={(e) => handleFieldChange('status', e.target.value)}
          />
        );
      
      case 'substatus':
        return (
          <StatusBadge 
            status={value} 
            type="substatus"
            onChange={(e) => handleFieldChange('substatus', e.target.value)}
          />
        );
      
      case 'actions':
        return (
          <div className="flex space-x-2">
            <button 
              onClick={() => onEdit(lead)}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button 
              onClick={() => onDelete(lead.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        );
      
      default:
        // For editable fields like age, grade, remarks etc.
        if (['age', 'grade', 'remarks', 'course_duration'].includes(key)) {
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        
        // For date fields
        if (key.includes('date') || key.includes('call')) {
          return (
            <input
              type="date"
              value={value ? value.split('T')[0] : ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        
        // Default cell display
        return value || '-';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="p-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(lead.id)}
          className="rounded border-gray-300"
        />
      </td>
      {Object.keys(columns)
        .filter(key => columns[key].visible)
        .map(key => (
          <td key={key} className="p-2">
            {renderCell(key)}
          </td>
        ))}
    </tr>
  );
};