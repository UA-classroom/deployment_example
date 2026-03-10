import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import authStore from "../store/authStore";

function DashboardUsersPage() {
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchUsers() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_API_URL}/general/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-w-xl">
      <div className="min-h-screen my-8 bg-white border border-gray-200 shadow-md">
        <div className="p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Users</h1>
              <p className="mt-2 text-sm text-gray-700">
                A list of all users in the system
              </p>
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
            <div className="flow-root mt-8">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Role
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-0"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-4 pl-4 pr-3 text-sm text-gray-500 text-center"
                          >
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-0">
                              <Link to={`/dashboard/users/${user.id}`}>
                                {user.first_name} {user.last_name}
                              </Link>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {user.is_superuser ? (
                                <span className="inline-flex rounded-full bg-purple-100 px-2 text-xs font-semibold leading-5 text-purple-800">
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-sm whitespace-nowrap">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5
                                ${
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
                                className="text-indigo-600 hover:text-indigo-900"
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
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardUsersPage;