import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import authStore from "../store/authStore";

export default function GradesPage() {
  const { cohortId } = useParams();
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);

  const [cohort, setCohort] = useState(null);
  const [courses, setCourses] = useState([]);
  const [gradesByCourse, setGradesByCourse] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    setIsLoading(true);
    try {
      // Fetch cohort detail (includes enrollments)
      const cohortRes = await fetch(`${BASE_API_URL}/cohorts/${cohortId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!cohortRes.ok) throw new Error("Failed to load cohort");
      const cohortData = await cohortRes.json();
      setCohort(cohortData);

      // Fetch courses for the program
      const coursesRes = await fetch(
        `${BASE_API_URL}/programs/${cohortData.program_id}/courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!coursesRes.ok) throw new Error("Failed to load courses");
      const coursesData = await coursesRes.json();
      setCourses(coursesData);

      // Fetch grades for each course
      const gradesMap = {};
      for (const course of coursesData) {
        const gradesRes = await fetch(
          `${BASE_API_URL}/courses/${course.id}/grades`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (gradesRes.ok) {
          gradesMap[course.id] = await gradesRes.json();
        }
      }
      setGradesByCourse(gradesMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [cohortId]);

  function findGrade(courseId, studentId) {
    const courseGrades = gradesByCourse[courseId] || [];
    return courseGrades.find((g) => g.student_id === studentId);
  }

  async function handleGradeChange(courseId, studentId, gradeValue, existingGrade) {
    try {
      if (existingGrade) {
        // Update existing grade
        const response = await fetch(
          `${BASE_API_URL}/grades/${existingGrade.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ grade: gradeValue }),
          }
        );
        if (!response.ok) throw new Error("Failed to update grade");
      } else {
        // Create new grade
        const response = await fetch(
          `${BASE_API_URL}/courses/${courseId}/grades`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              student_id: studentId,
              grade: gradeValue,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to set grade");
      }
      // Refresh grades for the affected course
      const gradesRes = await fetch(
        `${BASE_API_URL}/courses/${courseId}/grades`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (gradesRes.ok) {
        const updated = await gradesRes.json();
        setGradesByCourse((prev) => ({ ...prev, [courseId]: updated }));
      }
    } catch (err) {
      console.error("Error setting grade:", err);
    }
  }

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

  if (!cohort) return null;

  const enrollments = cohort.enrollments || [];

  return (
    <div className="min-h-screen p-8">
      <div className="mb-6">
        <Link
          to={`/dashboard/cohorts/${cohortId}`}
          className="text-primary-600 hover:text-primary-700 hover:underline"
        >
          Back to Cohort
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Grades - {cohort.cohort_code}
          </h1>
        </div>

        <div className="p-6 overflow-x-auto">
          {enrollments.length === 0 || courses.length === 0 ? (
            <p className="text-sm text-gray-500">
              No students or courses to display.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-2 pr-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-white">
                    Student
                  </th>
                  {courses.map((course) => (
                    <th
                      key={course.id}
                      className="px-3 py-2 text-left text-sm font-semibold text-gray-900"
                    >
                      {course.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="py-2 pr-3 text-sm text-gray-900 sticky left-0 bg-white">
                      {enrollment.student.first_name}{" "}
                      {enrollment.student.last_name}
                    </td>
                    {courses.map((course) => {
                      const existing = findGrade(
                        course.id,
                        enrollment.student_id
                      );
                      return (
                        <td key={course.id} className="px-3 py-2 text-sm">
                          <select
                            value={existing?.grade || ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleGradeChange(
                                  course.id,
                                  enrollment.student_id,
                                  e.target.value,
                                  existing
                                );
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">--</option>
                            <option value="IG">IG</option>
                            <option value="G">G</option>
                            <option value="VG">VG</option>
                          </select>
                        </td>
                      );
                    })}
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
