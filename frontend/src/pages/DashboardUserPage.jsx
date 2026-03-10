import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RoleBadge from "../components/RoleBadge";
import authStore from "../store/authStore";

export default function DashboardUserPage() {
  const { userId } = useParams();
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);
  const userData = authStore((state) => state.userData);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Edit form state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "" });

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Role change state
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const isAdmin = userData?.role === "admin";
  const isSelf = userData?.id === Number(userId);

  async function fetchUserDetail() {
    setIsLoading(true);
    try {
      const [userRes, rolesRes] = await Promise.all([
        fetch(`${BASE_API_URL}/general/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        isAdmin
          ? fetch(`${BASE_API_URL}/general/roles`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : Promise.resolve(null),
      ]);

      if (!userRes.ok) throw new Error(`HTTP error! status: ${userRes.status}`);
      const userJson = await userRes.json();
      setUser(userJson);
      setEditForm({
        first_name: userJson.first_name,
        last_name: userJson.last_name,
        email: userJson.email,
      });

      if (rolesRes && rolesRes.ok) {
        const rolesJson = await rolesRes.json();
        setRoles(rolesJson);
        const currentRole = rolesJson.find((r) => r.name === userJson.role);
        if (currentRole) setSelectedRoleId(currentRole.id);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError("Could not load user details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  function showFeedback(message, type = "success") {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleRoleChange() {
    if (!selectedRoleId) return;
    try {
      const response = await fetch(`${BASE_API_URL}/general/user/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role_id: selectedRoleId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to update role");
      }
      const updated = await response.json();
      setUser(updated);
      showFeedback("Role updated successfully");
    } catch (err) {
      showFeedback(err.message, "error");
    }
  }

  async function handlePasswordReset() {
    if (!newPassword || newPassword.length < 8) {
      showFeedback("Password must be at least 8 characters", "error");
      return;
    }
    try {
      const response = await fetch(`${BASE_API_URL}/general/user/${userId}/reset-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to reset password");
      }
      setNewPassword("");
      setShowPasswordReset(false);
      showFeedback("Password reset successfully");
    } catch (err) {
      showFeedback(err.message, "error");
    }
  }

  async function handleToggleStatus() {
    if (isSelf) {
      showFeedback("You cannot disable your own account", "error");
      return;
    }
    const action = user.disabled ? "enable" : "disable";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const response = await fetch(`${BASE_API_URL}/general/user/${userId}/toggle-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to update status");
      }
      const updated = await response.json();
      setUser(updated);
      showFeedback(`User ${updated.disabled ? "disabled" : "enabled"} successfully`);
    } catch (err) {
      showFeedback(err.message, "error");
    }
  }

  async function handleEditSave() {
    try {
      const response = await fetch(`${BASE_API_URL}/general/user/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to update user");
      }
      const updated = await response.json();
      setUser(updated);
      setEditMode(false);
      showFeedback("User info updated successfully");
    } catch (err) {
      showFeedback(err.message, "error");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-100 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <Link to="/dashboard/users" className="text-primary-600 hover:text-primary-700 underline mt-4 block">
            Back to users list
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-yellow-100 p-4 rounded-md">
          <p className="text-yellow-700">User not found.</p>
          <Link to="/dashboard/users" className="text-primary-600 hover:text-primary-700 underline mt-4 block">
            Back to users list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/dashboard/users" className="text-primary-600 hover:text-primary-700 hover:underline">
          Back to Users List
        </Link>
      </div>

      {feedback && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            feedback.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <div className="flex space-x-2">
              <RoleBadge role={user.role} />
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  user.disabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }`}
              >
                {user.disabled ? "Inactive" : "Active"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">User Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">User ID</p>
              <p className="mt-1 text-sm text-gray-900">{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Account Created</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions - only visible to admin users */}
      {isAdmin && (
        <div className="mt-6 space-y-6">
          {/* Edit User Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Edit User Info</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit
                </button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleEditSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditForm({
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">First Name</p>
                  <p className="mt-1 text-gray-900">{user.first_name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Last Name</p>
                  <p className="mt-1 text-gray-900">{user.last_name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Change Role */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Role</h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedRoleId || ""}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="block rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRoleChange}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Update Role
              </button>
            </div>
          </div>

          {/* Password Reset */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Password Reset</h2>
              {!showPasswordReset && (
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Reset Password
                </button>
              )}
            </div>

            {showPasswordReset ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handlePasswordReset}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  This will invalidate all active sessions for this user.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Set a new password for this user. They will be logged out of all sessions.
              </p>
            )}
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">
                  This account is currently{" "}
                  <span className={`font-semibold ${user.disabled ? "text-red-600" : "text-green-600"}`}>
                    {user.disabled ? "disabled" : "active"}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {user.disabled
                    ? "The user cannot log in. Enable to restore access."
                    : "The user can log in and use the system."}
                </p>
              </div>
              <button
                onClick={handleToggleStatus}
                disabled={isSelf}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isSelf
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : user.disabled
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {user.disabled ? "Enable Account" : "Disable Account"}
              </button>
            </div>
            {isSelf && (
              <p className="text-xs text-amber-600 mt-2">You cannot disable your own account.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
