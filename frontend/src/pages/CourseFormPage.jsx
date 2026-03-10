import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import authStore from "../store/authStore";

export default function CourseFormPage() {
  const { programId, courseId } = useParams();
  const navigate = useNavigate();
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);

  const isEditing = !!courseId;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [yhPoints, setYhPoints] = useState(20);
  const [sortOrder, setSortOrder] = useState(0);
  const [courseProgramId, setCourseProgramId] = useState(programId || "");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchCourse() {
    try {
      const response = await fetch(`${BASE_API_URL}/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Could not load course data.");
      }
      const data = await response.json();
      setName(data.name);
      setCode(data.code);
      setDescription(data.description || "");
      setYhPoints(data.yh_points);
      setSortOrder(data.sort_order);
      setCourseProgramId(data.program_id);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  useEffect(() => {
    if (isEditing) {
      fetchCourse();
    }
  }, [courseId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const body = {
      name,
      code,
      description: description || null,
      yh_points: yhPoints,
      sort_order: sortOrder,
    };

    try {
      let response;
      if (isEditing) {
        response = await fetch(`${BASE_API_URL}/courses/${courseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        response = await fetch(
          `${BASE_API_URL}/programs/${programId}/courses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save course");
      }

      const targetProgramId = programId || courseProgramId || data.program_id;
      navigate(`/dashboard/programs/${targetProgramId}`);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const resolvedProgramId = programId || courseProgramId;
  const backLink = resolvedProgramId
    ? `/dashboard/programs/${resolvedProgramId}`
    : "/dashboard/programs";

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to={backLink} className="text-primary-600 hover:text-primary-700 hover:underline">
            Back to Program
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? "Edit Course" : "Add Course"}
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="name"
                >
                  Course Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="code"
                >
                  Course Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  placeholder="e.g. PYTHON101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="description"
              >
                Description
              </label>
              <textarea
                id="description"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="yhPoints"
                >
                  YH Points
                </label>
                <input
                  id="yhPoints"
                  type="number"
                  min="1"
                  required
                  value={yhPoints}
                  onChange={(e) => setYhPoints(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="sortOrder"
                >
                  Sort Order
                </label>
                <input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {message.text && (
              <div
                className={`p-4 mb-6 rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/25 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Update Course"
                  : "Add Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
