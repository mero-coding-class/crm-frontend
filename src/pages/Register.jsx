// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/RegisterUser.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BASE_URL } from "../config";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const canManage = (role) =>
  ["admin", "superadmin"].includes((role || "").toLowerCase());

// Sortable row component
const SortableRow = ({
  u,
  editUserId,
  editUsername,
  setEditUsername,
  setEditUserId,
  handleEditSave,
  handleDelete,
  selectedUsers,
  toggleSelect,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: u.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border-t hover:bg-gray-50"
    >
      {/* Checkbox */}
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={selectedUsers.includes(u.id)}
          onChange={() => toggleSelect(u.id)}
          className="h-4 w-4"
        />
      </td>

      <td className="px-3 py-2">{u.id}</td>

      <td className="px-3 py-2">
        {editUserId === u.id ? (
          <input
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            className="border p-1 rounded w-full"
          />
        ) : (
          u.username
        )}
      </td>

      <td className="px-3 py-2">{u.role}</td>

      <td className="px-3 py-2 space-x-2 text-center">
        {editUserId === u.id ? (
          <>
            <button
              onClick={() => handleEditSave(u.id)}
              className="px-2 py-1 bg-green-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEditUserId(null)}
              className="px-2 py-1 bg-gray-400 text-white rounded"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setEditUserId(u.id);
                setEditUsername(u.username);
              }}
              className="px-2 py-1 bg-blue-600 text-white rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(u.id)}
              className="px-2 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

const RegisterUser = () => {
  const { authToken } = useAuth();
  const navigate = useNavigate();

  const roleFromStorage = (localStorage.getItem("role") || "").toLowerCase();

  const [form, setForm] = useState({
    username: "",
    role: "sales_rep",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // users
  const [users, setUsers] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [editUsername, setEditUsername] = useState("");

  // selection
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Force-blank on mount
  useEffect(() => {
    setForm({ username: "", role: "sales_rep", password: "" });
  }, []);

  // Fetch all users if admin/superadmin
  useEffect(() => {
    if (canManage(roleFromStorage)) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/`, {
        headers: { Authorization: `Token ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users.");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Could not load users." });
    }
  };

  // Guard: only admin/superadmin
  if (!canManage(roleFromStorage)) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          403 – Forbidden
        </h2>
        <p className="text-gray-600">
          You don’t have permission to create users. Only <b>admin</b> and{" "}
          <b>superadmin</b> can access this page.
        </p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleClear = () => {
    setForm({ username: "", role: "sales_rep", password: "" });
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.username.trim() || !form.password) {
      setMsg({ type: "error", text: "Username and password are required." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          role: form.role,
          password: form.password,
        }),
      });

      if (!res.ok) {
        let errText = "Failed to create user.";
        try {
          const data = await res.json();
          errText = data.detail || JSON.stringify(data);
        } catch {
          errText = await res.text();
        }
        throw new Error(errText);
      }

      setMsg({ type: "success", text: "User created successfully." });
      setForm({ username: "", role: "sales_rep", password: "" });
      fetchUsers(); // refresh list
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to create user." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await fetch(`${BASE_URL}/users/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete user.");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedUsers.length} users?`)) return;
    try {
      await Promise.all(
        selectedUsers.map((id) =>
          fetch(`${BASE_URL}/users/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Token ${authToken}` },
          })
        )
      );
      setUsers((prev) => prev.filter((u) => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
    } catch (err) {
      alert("Failed to delete some users.");
    }
  };

  const handleEditSave = async (id) => {
    try {
      const payload = { username: editUsername };

      const res = await fetch(`${BASE_URL}/users/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update user.");
      const updated = await res.json();

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, username: updated.username } : u
        )
      );
      setEditUserId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // selection handlers
  const toggleSelect = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  // dnd-kit drag reorder
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setUsers((prev) => {
        const oldIndex = prev.findIndex((u) => u.id === active.id);
        const newIndex = prev.findIndex((u) => u.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Create User</h2>
      {msg.text && (
        <div
          className={`mb-4 p-3 rounded ${
            msg.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Username
          </label>
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter username"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Role
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="sales_rep">sales_rep</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Password
          </label>
          <input
            name="password"
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="Set a password"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="mt-1 text-sm text-blue-600 hover:underline"
          >
            {showPw ? "Hide" : "Show"} password
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create User"}
        </button>
      </form>

      {/* Users List */}
      <h3 className="text-xl font-bold mt-8 mb-3">All Users</h3>

      {selectedUsers.length > 0 && (
        <button
          onClick={handleBulkDelete}
          className="mb-3 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete Selected ({selectedUsers.length})
        </button>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border border-gray-200 text-sm rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={
                    selectedUsers.length === users.length && users.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              </th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Username</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>

          <SortableContext
            items={users.map((u) => u.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {users.map((u) => (
                <SortableRow
                  key={u.id}
                  u={u}
                  editUserId={editUserId}
                  editUsername={editUsername}
                  setEditUsername={setEditUsername}
                  setEditUserId={setEditUserId}
                  handleEditSave={handleEditSave}
                  handleDelete={handleDelete}
                  selectedUsers={selectedUsers}
                  toggleSelect={toggleSelect}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
};

export default RegisterUser;
