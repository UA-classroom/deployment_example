import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import authStore from "../store/authStore";

export default function ProgramFormPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const BASE_API_URL = import.meta.env.VITE_API_URL;
  const token = authStore((state) => state.token);

  const isEditing = !!programId;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [yhPoints, setYhPoints] = useState(400);
  const [durationWeeks, setDurationWeeks] = useState(80);
  const [status, setStatus] = useState("draft");
  const [leaderId, setLeaderId] = useState("");
  const [leaders, setLeaders] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchProgram() {
    try {
      const response = await fetch(
        `${BASE_API_URL}/programs/${programId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to load program");
      const data = await response.json();
      setName(data.name);
      setCode(data.code);
      setDescription(data.description || "");
      setYhPoints(data.yh_points);
      setDurationWeeks(data.duration_weeks);
      setStatus(data.status);
      setLeaderId(data.leader_id || "");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function fetchLeaders() {
    try {
      const response = await fetch(
        `${BASE_API_URL}/general/user?role=utbildningsledare`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setLeaders(data);
      }
    } catch (err) {
      console.error("Error fetching leaders:", err);
    }
  }

  useEffect(() => {
    fetchLeaders();
    if (isEditing) {
      fetchProgram();
    }
  }, [programId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const body = {
      name,
      code,
      description: description || null,
      yh_points: yhPoints,
      duration_weeks: durationWeeks,
      leader_id: leaderId ? Number(leaderId) : null,
    };

    if (isEditing) {
      body.status = status;
    }

    try {
      const response = await fetch(
        isEditing
          ? `${BASE_API_URL}/programs/${programId}`
          : `${BASE_API_URL}/programs`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save program");
      }

      navigate(`/dashboard/programs/${data.id}`);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            to="/dashboard/programs"
            className="text-primary-600 hover:text-primary-700 hover:underline"
          >
            Back to Programs
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? "Edit Program" : "Create Program"}
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="name"
                >
                  Program Name
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
                  Program Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  placeholder="e.g. SUVNET26"
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
                  htmlFor="durationWeeks"
                >
                  Duration (weeks)
                </label>
                <input
                  id="durationWeeks"
                  type="number"
                  min="1"
                  required
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mb-6">
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
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="leader"
              >
                Utbildningsledare
              </label>
              <select
                id="leader"
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- None --</option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.first_name} {leader.last_name} ({leader.email})
                  </option>
                ))}
              </select>
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
                  ? "Update Program"
                  : "Create Program"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
