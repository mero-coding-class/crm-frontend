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

const INITIAL_VISIBLE_USERS = 4;
const canManage = (role) =>
  ["admin", "superadmin"].includes((role || "").toLowerCase());

// Sortable row component
const SortableRow = ({
  u,
  editUserId,
  editUsername,
  editPassword,
  setEditUsername,
  setEditPassword,
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
      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
    >
      {/* Checkbox */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        <input
          type="checkbox"
          checked={selectedUsers.includes(u.id)}
          onChange={() => toggleSelect(u.id)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {u.id}
      </td>

      <td className="px-6 py-4 align-top text-sm text-gray-600 max-w-[360px]">
        {editUserId === u.id ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full max-w-[220px] truncate"
            />
            <input
              type="password"
              placeholder="New password (leave blank to keep)"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              autoComplete="new-password"
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full max-w-[220px] text-sm"
            />
          </div>
        ) : (
          <div className="truncate max-w-[220px]">{u.username}</div>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {u.role}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {editUserId === u.id ? (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleEditSave(u.id)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-green-600 hover:bg-green-100 transition-colors"
              aria-label="Save"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                setEditUserId(null);
                try {
                  setEditPassword("");
                } catch (e) {}
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
              aria-label="Cancel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditUserId(u.id);
                setEditUsername(u.username);
                try {
                  setEditPassword("");
                } catch (e) {}
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-yellow-500 hover:bg-yellow-100 transition-colors"
              aria-label="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(u.id)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-red-600 hover:bg-red-100 transition-colors"
              aria-label="Delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
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
  const [editPassword, setEditPassword] = useState("");

  // selection
  const [selectedUsers, setSelectedUsers] = useState([]);

  // for "show more" functionality
  const [visibleUsers, setVisibleUsers] = useState(INITIAL_VISIBLE_USERS);
  const hasMoreUsers = users.length > visibleUsers;
  const isAllUsersVisible = users.length <= visibleUsers;

  const handleShowMore = () => {
    setVisibleUsers(users.length);
  };

  const handleShowLess = () => {
    setVisibleUsers(INITIAL_VISIBLE_USERS);
  };

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
      // Normalize response to always be an array. Backends may return:
      // - an array directly
      // - a paginated object { results: [...] }
      // - an object with users: [...] or data: [...]
      let usersData = [];
      if (Array.isArray(data)) {
        usersData = data;
      } else if (data && Array.isArray(data.results)) {
        usersData = data.results;
      } else if (data && Array.isArray(data.users)) {
        usersData = data.users;
      } else if (data && Array.isArray(data.data)) {
        usersData = data.data;
      } else {
        // Unexpected shape — keep users empty but log for debugging
        console.warn("Unexpected users response shape:", data);
        usersData = [];
      }
      setUsers(usersData);
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
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${BASE_URL}/users/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete user.");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelectedUsers((prev) => prev.filter((uid) => uid !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedUsers.length} users?`
      )
    )
      return;
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
      if (editPassword && String(editPassword).trim().length > 0) {
        payload.password = editPassword;
      }

      const res = await fetch(`${BASE_URL}/users/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update user.");
      // Some backends respond with 204 No Content. Handle both JSON and empty responses.
      let updated = null;
      try {
        // only attempt to parse JSON if there is content
        const text = await res.text();
        updated = text ? JSON.parse(text) : null;
      } catch (e) {
        // if parsing fails, ignore and fall back to local username
        updated = null;
      }

      const newName = (updated && updated.username) || editUsername;
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, username: newName } : u))
      );
      setEditUserId(null);
      setEditPassword("");
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
    if (selectedUsers.length === users.slice(0, visibleUsers).length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.slice(0, visibleUsers).map((u) => u.id));
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
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">
        Create New User
      </h2>
      {msg.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            msg.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Create Form */}
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"
      >
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Username
          </label>
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter username"
            autoComplete="off"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Role
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="sales_rep">Sales Rep</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Set a password"
              autoComplete="new-password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0010 15c-4.321 0-8.243-2.922-9.542-7c.277-.962.748-1.84 1.396-2.613l-1.636-1.636zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                  <path d="M14.99 12.162l-3.34-3.34a2 2 0 01-2.828 0l-1.765 1.765A10.009 10.009 0 0010 15c-1.396 0-2.731-.475-3.903-1.35l2.253-2.253a4 4 0 015.657 0l2.253-2.253A10.01 10.01 0 0014.99 12.162z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="col-span-1 md:col-span-3 mt-4 w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating…" : "Create User"}
        </button>
      </form>

      {/* Users List */}
      <h3 className="text-2xl font-bold mt-12 mb-4 text-gray-900 border-b pb-2">
        All Users
      </h3>

      {selectedUsers.length > 0 && (
        <button
          onClick={handleBulkDelete}
          className="mb-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-semibold flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z"
              clipRule="evenodd"
            />
          </svg>
          Delete Selected ({selectedUsers.length})
        </button>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      selectedUsers.length > 0 &&
                      selectedUsers.length ===
                        users.slice(0, visibleUsers).length
                    }
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <SortableContext
              items={users.slice(0, visibleUsers).map((u) => u.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white divide-y divide-gray-200">
                {users.slice(0, visibleUsers).map((u) => (
                  <SortableRow
                    key={u.id}
                    u={u}
                    editUserId={editUserId}
                    editUsername={editUsername}
                    editPassword={editPassword}
                    setEditUsername={setEditUsername}
                    setEditPassword={setEditPassword}
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
        </div>
      </DndContext>

      {/* Show more/less buttons */}
      <div className="flex justify-center mt-6 space-x-4">
        {users.length > INITIAL_VISIBLE_USERS && !isAllUsersVisible && (
          <button
            onClick={handleShowMore}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Show All Users ({users.length})
          </button>
        )}
        {visibleUsers > INITIAL_VISIBLE_USERS && (
          <button
            onClick={handleShowLess}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
  );
};

export default RegisterUser;
