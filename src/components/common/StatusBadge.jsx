import React from 'react';
import { getStatusColor, getSubStatusColor } from '../../utils/statusColors';

export const StatusBadge = ({ 
  status, 
  type = 'status', 
  onChange, 
  className = '', 
  disabled = false,
  isLoading = false,
  error = null 
}) => {
  const colors = type === 'status' ? getStatusColor(status) : getSubStatusColor(status);
  const options = type === 'status' 
    ? ['Active', 'Converted', 'Lost']
    : ['New', 'Open', 'Followup', 'inProgress', 'Average', 'Interested', 'Junk'];

  return disabled ? (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}>
      {status}
    </span>
  ) : (
    <select
      value={status || (type === 'status' ? 'Active' : 'New')}
      onChange={onChange}
      className={`appearance-none border rounded-full px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};