import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import authStore from "../store/authStore";

export default function CohortDetailPage() {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);
  const userData = authStore((state) => state.userData);

  const [cohort, setCohort] = useState(null);
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollMessage, setEnrollMessage] = useState({ type: "", text: "" });

  const isAdmin = userData?.role === "admin";
  const isStaff =
    userData?.role === "admin" || userData?.role === "utbildningsledare";

  async function fetchCohort() {
    try {
      const response = await fetch(`${BASE_API_URL}/cohorts/${cohortId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load cohort");
      const data = await response.json();
      setCohort(data);
      setStudents(data.enrollments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAvailableStudents() {
    try {
      const response = await fetch(
        `${BASE_API_URL}/general/user?role=student`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  }

  useEffect(() => {
    fetchCohort();
    if (isStaff) {
      fetchAvailableStudents();
    }
  }, [cohortId]);

  async function handleEnroll(e) {
    e.preventDefault();
    if (!selectedStudentId) return;
    setEnrollMessage({ type: "", text: "" });

    try {
      const response = await fetch(
        `${BASE_API_URL}/cohorts/${cohortId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ student_id: Number(selectedStudentId) }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to enroll student");
      }
      setEnrollMessage({ type: "success", text: "Student enrolled successfully" });
      setSelectedStudentId("");
      fetchCohort();
    } catch (err) {
      setEnrollMessage({ type: "error", text: err.message });
    }
  }

  async function handleStatusChange(enrollmentId, newStatus) {
    try {
      const response = await fetch(
        `${BASE_API_URL}/enrollments/${enrollmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update status");
      }
      fetchCohort();
    } catch (err) {
      console.error("Error updating enrollment status:", err);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this cohort?")) return;
    try {
      const response = await fetch(`${BASE_API_URL}/cohorts/${cohortId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete cohort");
      navigate(`/dashboard/programs/${cohort.program_id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-lg text-gray-600">Loading cohort details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-100 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!cohort) return null;

  return (
    <div className="min-h-screen p-8">
      <div className="mb-6">
        <Link
          to={`/dashboard/programs/${cohort.program_id}`}
          className="text-primary-600 hover:text-primary-700 hover:underline"
        >
          Back to Program
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {cohort.cohort_code}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={cohort.status} />
              {isStaff && (
                <Link
                  to={`/dashboard/cohorts/${cohortId}/grades`}
                  className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Grades
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link
                    to={`/dashboard/cohorts/${cohortId}/edit`}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="mt-1 text-sm text-gray-900">{cohort.start_date}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="mt-1 text-sm text-gray-900">{cohort.end_date}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Study Pace</p>
              <p className="mt-1 text-sm text-gray-900">{cohort.study_pace}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Seats</p>
              <p className="mt-1 text-sm text-gray-900">
                {students.filter((e) => e.status === "active").length} / {cohort.max_seats}
              </p>
            </div>
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Enrolled Students
          </h2>

          {students.length === 0 ? (
            <p className="text-sm text-gray-500">No students enrolled yet.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-300 mb-6">
              <thead>
                <tr>
                  <th className="py-2 pr-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Enrolled
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  {isStaff && (
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                      Change Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="py-2 pr-3 text-sm text-gray-900">
                      {enrollment.student.first_name} {enrollment.student.last_name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {enrollment.student.email}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {enrollment.enrollment_date}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <StatusBadge status={enrollment.status} />
                    </td>
                    {isStaff && (
                      <td className="px-3 py-2 text-sm">
                        <select
                          value={enrollment.status}
                          onChange={(e) =>
                            handleStatusChange(enrollment.id, e.target.value)
                          }
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="on_leave">On Leave</option>
                          <option value="graduated">Graduated</option>
                          <option value="dropped_out">Dropped Out</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Enroll Student Form */}
          {isStaff && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Enroll Student
              </h3>
              <form onSubmit={handleEnroll} className="flex items-end gap-3">
                <div className="flex-1">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">-- Select Student --</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!selectedStudentId}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/25 disabled:opacity-50 text-sm"
                >
                  Enroll
                </button>
              </form>
              {enrollMessage.text && (
                <div
                  className={`mt-2 p-2 rounded-md text-sm ${
                    enrollMessage.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {enrollMessage.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
