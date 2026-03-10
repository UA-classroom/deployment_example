import { Link } from "react-router-dom";
import authStore from "../store/authStore";

const statCards = [
  {
    label: "Aktiva program",
    value: "3",
    bg: "bg-primary-50",
    text: "text-primary-600",
  },
  {
    label: "Studenter",
    value: "42",
    bg: "bg-green-50",
    text: "text-success",
  },
  {
    label: "LIA-platser",
    value: "12",
    bg: "bg-amber-50",
    text: "text-warning",
  },
  {
    label: "Senaste betyg",
    value: "7",
    bg: "bg-indigo-50",
    text: "text-indigo",
  },
];

const quickLinksByRole = {
  admin: [
    {
      label: "Hantera anvandare",
      description: "Lagg till, redigera och hantera anvandarkonton",
      to: "/dashboard/users",
    },
    {
      label: "Skapa program",
      description: "Lagg till ett nytt utbildningsprogram",
      to: "/dashboard/programs/new",
    },
  ],
  utbildningsledare: [
    {
      label: "Mina program",
      description: "Se och hantera dina tilldelade program",
      to: "/dashboard/programs",
    },
  ],
  student: [
    {
      label: "Mina program",
      description: "Se dina aktiva program och kurser",
      to: "/dashboard/programs",
    },
  ],
};

function formatDate(date) {
  return date.toLocaleDateString("sv-SE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardIndexPage() {
  const userData = authStore((state) => state.userData);
  const firstName = userData?.first_name || "Anvandare";
  const role = userData?.role || "student";
  const quickLinks = quickLinksByRole[role] || [];
  const today = formatDate(new Date());

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hej, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl shadow-sm border border-gray-100 p-5 ${card.bg}`}
          >
            <p className="text-sm font-medium text-gray-600 mb-1">
              {card.label}
            </p>
            <p className={`text-3xl font-bold ${card.text}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Snabbllankar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-medium text-gray-900">{link.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {link.description}
                </p>
              </div>
              <span className="text-gray-400 ml-4" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
