import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import authStore from "../store/authStore";

export default function ProgramDetailPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);
  const userData = authStore((state) => state.userData);
  const [program, setProgram] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = userData?.role === "admin";
  const isStaff =
    userData?.role === "admin" || userData?.role === "utbildningsledare";

  async function fetchProgram() {
    setIsLoading(true);
    try {
      const [programRes, cohortsRes] = await Promise.all([
        fetch(`${BASE_API_URL}/programs/${programId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_API_URL}/programs/${programId}/cohorts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!programRes.ok) {
        throw new Error(`HTTP error! status: ${programRes.status}`);
      }
      const data = await programRes.json();
      setProgram(data);

      if (cohortsRes.ok) {
        setCohorts(await cohortsRes.json());
      }
    } catch (err) {
      console.error("Error fetching program:", err);
      setError("Could not load program details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      const response = await fetch(
        `${BASE_API_URL}/programs/${programId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      navigate("/dashboard/programs");
    } catch (err) {
      console.error("Error deleting program:", err);
      setError("Could not delete program.");
    }
  }

  useEffect(() => {
    fetchProgram();
  }, [programId]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-100 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <Link
            to="/dashboard/programs"
            className="text-primary-600 hover:text-primary-700 underline mt-4 block"
          >
            Back to programs
          </Link>
        </div>
      </div>
    );
  }

  if (!program) return null;

  return (
    <div className="min-h-screen p-8">
      <div className="mb-6">
        <Link to="/dashboard/programs" className="text-primary-600 hover:text-primary-700 hover:underline">
          Back to Programs
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {program.name}
              </h1>
              <p className="text-gray-500 mt-1">{program.code}</p>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={program.status} />
              {isAdmin && (
                <>
                  <Link
                    to={`/dashboard/programs/${programId}/edit`}
                    className="px-3 py-1 text-sm text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/25"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">YH Points</p>
              <p className="mt-1 text-sm text-gray-900">
                {program.yh_points} p
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p className="mt-1 text-sm text-gray-900">
                {program.duration_weeks} weeks
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(program.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {program.description && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="mt-1 text-sm text-gray-900">
                {program.description}
              </p>
            </div>
          )}
        </div>

        {/* Cohorts */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Cohorts</h2>
            {isAdmin && (
              <Link
                to={`/dashboard/programs/${programId}/cohorts/new`}
                className="px-3 py-1 text-sm text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/25"
              >
                Create Cohort
              </Link>
            )}
          </div>

          {cohorts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No cohorts created for this program yet.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-2 pr-3 text-left text-sm font-semibold text-gray-900">
                    Cohort Code
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Start
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    End
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Pace
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Seats
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cohorts.map((cohort) => (
                  <tr key={cohort.id}>
                    <td className="py-2 pr-3 text-sm">
                      <Link
                        to={`/dashboard/cohorts/${cohort.id}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {cohort.cohort_code}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {cohort.start_date}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {cohort.end_date}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {cohort.study_pace}%
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {cohort.max_seats}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <StatusBadge status={cohort.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Courses */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Courses</h2>
            {isStaff && (
              <Link
                to={`/dashboard/programs/${programId}/courses/new`}
                className="px-3 py-1 text-sm text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/25"
              >
                Add Course
              </Link>
            )}
          </div>

          {program.courses.length === 0 ? (
            <p className="text-sm text-gray-500">
              No courses added to this program yet.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-2 pr-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Code
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Points
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Order
                  </th>
                  {isStaff && (
                    <th className="relative py-2 pl-3 pr-4">
                      <span className="sr-only">Edit</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {program.courses.map((course) => (
                  <tr key={course.id}>
                    <td className="py-2 pr-3 text-sm text-gray-900">
                      {course.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {course.code}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {course.yh_points} p
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {course.sort_order}
                    </td>
                    {isStaff && (
                      <td className="py-2 pl-3 pr-4 text-sm text-right">
                        <Link
                          to={`/dashboard/courses/${course.id}/edit`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
