import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import authStore from "../store/authStore";

export default function CohortFormPage() {
  const { programId, cohortId } = useParams();
  const navigate = useNavigate();
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);

  const isEditing = !!cohortId;

  const [cohortCode, setCohortCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [studyPace, setStudyPace] = useState(100);
  const [maxSeats, setMaxSeats] = useState(30);
  const [status, setStatus] = useState("planned");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backProgramId, setBackProgramId] = useState(programId || null);

  async function fetchCohort() {
    try {
      const response = await fetch(`${BASE_API_URL}/cohorts/${cohortId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load cohort");
      const data = await response.json();
      setCohortCode(data.cohort_code);
      setStartDate(data.start_date);
      setEndDate(data.end_date);
      setStudyPace(data.study_pace);
      setMaxSeats(data.max_seats);
      setStatus(data.status);
      setBackProgramId(data.program_id);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  useEffect(() => {
    if (isEditing) {
      fetchCohort();
    }
  }, [cohortId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const body = {
      cohort_code: cohortCode,
      start_date: startDate,
      end_date: endDate,
      study_pace: studyPace,
      max_seats: maxSeats,
    };

    if (isEditing) {
      body.status = status;
    }

    try {
      const url = isEditing
        ? `${BASE_API_URL}/cohorts/${cohortId}`
        : `${BASE_API_URL}/programs/${programId}/cohorts`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save cohort");
      }

      navigate(`/dashboard/cohorts/${data.id}`);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const backLink = backProgramId
    ? `/dashboard/programs/${backProgramId}`
    : "/dashboard/programs";

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            to={backLink}
            className="text-primary-600 hover:text-primary-700 hover:underline"
          >
            Back to Program
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? "Edit Cohort" : "Create Cohort"}
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="cohortCode"
                >
                  Cohort Code
                </label>
                <input
                  id="cohortCode"
                  type="text"
                  required
                  placeholder="e.g. SUVNET24"
                  value={cohortCode}
                  onChange={(e) => setCohortCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="maxSeats"
                >
                  Max Seats
                </label>
                <input
                  id="maxSeats"
                  type="number"
                  min="1"
                  required
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="startDate"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="endDate"
                >
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="studyPace"
                >
                  Study Pace (%)
                </label>
                <input
                  id="studyPace"
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={studyPace}
                  onChange={(e) => setStudyPace(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {isEditing && (
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
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
                  ? "Update Cohort"
                  : "Create Cohort"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
