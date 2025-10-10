import React from "react";

export default function AssignedToSelect({ isAdmin, users, usersLoading, value, onChange, RequiredLabel }) {
  if (!isAdmin) return null;
  return (
    <div>
      <label htmlFor="created_by" className="block text-sm font-medium text-gray-700">
        <RequiredLabel field="created_by">Assigned To</RequiredLabel>
      </label>
      {usersLoading ? (
        <div className="mt-1 p-2">Loading users...</div>
      ) : (
        <select
          id="created_by"
          name="created_by"
          value={value}
          onChange={onChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">(Unassigned)</option>
          {users.map((u) => (
            <option key={u.username || u.id} value={u.username || u.id}>
              {u.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
