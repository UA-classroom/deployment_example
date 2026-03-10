import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RoleBadge from "../components/RoleBadge";
import authStore from "../store/authStore";

const PAGE_SIZE = 20;

function DashboardUsersPage() {
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  async function fetchUsers() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("page_size", PAGE_SIZE);
      if (roleFilter) {
        params.set("role", roleFilter);
      }
      const url = `${BASE_API_URL}/general/user?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(term) ||
      user.last_name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });

  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-w-xl">
      <div className="min-h-screen my-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Users</h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage all users in the system
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                to="/dashboard/users/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/25"
              >
                Create User
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">All roles</option>
                <option value="admin">Admin</option>
                <option value="utbildningsledare">Utbildningsledare</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-4 mt-4 text-red-700 bg-red-100 rounded">
              {error}
            </div>
          ) : (
            <>
              <div className="flow-root mt-6">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                            Name
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Email
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Role
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="py-4 pl-4 pr-3 text-sm text-gray-500 text-center"
                            >
                              No users found
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id}>
                              <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-0">
                                <Link
                                  to={`/dashboard/users/${user.id}`}
                                  className="hover:text-primary-600"
                                >
                                  {user.first_name} {user.last_name}
                                </Link>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                {user.email}
                              </td>
                              <td className="px-3 py-4 text-sm">
                                <RoleBadge role={user.role} />
                              </td>
                              <td className="px-3 py-4 text-sm whitespace-nowrap">
                                <span
                                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    user.disabled
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {user.disabled ? "Inactive" : "Active"}
                                </span>
                              </td>
                              <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                                <Link
                                  to={`/dashboard/users/${user.id}`}
                                  className="text-primary-600 hover:text-primary-700"
                                >
                                  View details
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startItem}</span> to{" "}
                    <span className="font-medium">{endItem}</span> of{" "}
                    <span className="font-medium">{total}</span> users
                  </p>
                  <nav aria-label="Pagination" className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border ${
                            p === page
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardUsersPage;
