import { useEffect, useState } from "react";
import authStore from "../store/authStore";

export default function StudentGradesPage() {
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);
  const userData = authStore((state) => state.userData);

  const [grades, setGrades] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    if (!userData?.id) return;
    setIsLoading(true);
    try {
      const [gradesRes, enrollmentsRes] = await Promise.all([
        fetch(`${BASE_API_URL}/students/${userData.id}/grades`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_API_URL}/students/${userData.id}/enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (gradesRes.ok) {
        setGrades(await gradesRes.json());
      }
      if (enrollmentsRes.ok) {
        setEnrollments(await enrollmentsRes.json());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [userData?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-lg text-gray-600">Loading grades...</p>
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

  const gradeStyle = {
    VG: "bg-green-100 text-green-800",
    G: "bg-blue-100 text-blue-800",
    IG: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Grades</h1>

      {enrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Enrollments
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-900">
                    Cohort
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-900">
                    Enrolled
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 px-4 text-sm text-gray-900">
                      Cohort #{e.cohort_id}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-500">
                      {e.enrollment_date}
                    </td>
                    <td className="py-2 px-4 text-sm capitalize text-gray-500">
                      {e.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Course Grades
        </h2>
        {grades.length === 0 ? (
          <p className="text-sm text-gray-500">No grades recorded yet.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-900">
                    Course
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-900">
                    Grade
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-900">
                    Re-exam
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grades.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2 px-4 text-sm text-gray-900">
                      Course #{g.course_id}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          gradeStyle[g.grade] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {g.grade}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-500">
                      {new Date(g.graded_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-500">
                      {g.is_reexamination ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
