import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import authStore from "../store/authStore";

export default function ProgramsPage() {
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);
  const userData = authStore((state) => state.userData);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchPrograms() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_API_URL}/programs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      console.error("Error fetching programs:", err);
      setError("Failed to load programs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPrograms();
  }, []);

  const isAdmin = userData?.role === "admin";

  return (
    <div className="min-w-xl">
      <div className="min-h-screen my-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Programs</h1>
              <p className="mt-2 text-sm text-gray-700">
                All YH programs at this school
              </p>
            </div>
            {isAdmin && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  to="/dashboard/programs/new"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/25"
                >
                  Create Program
                </Link>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-gray-500">Loading programs...</p>
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
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                          Name
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Code
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          YH Points
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Duration
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
                      {programs.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-4 pl-4 pr-3 text-sm text-gray-500 text-center"
                          >
                            No programs found
                          </td>
                        </tr>
                      ) : (
                        programs.map((program) => (
                          <tr key={program.id}>
                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-0">
                              <Link to={`/dashboard/programs/${program.id}`}>
                                {program.name}
                              </Link>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {program.code}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {program.yh_points}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {program.duration_weeks} weeks
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              <StatusBadge status={program.status} />
                            </td>
                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                              <Link
                                to={`/dashboard/programs/${program.id}`}
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
          )}
        </div>
      </div>
    </div>
  );
}
