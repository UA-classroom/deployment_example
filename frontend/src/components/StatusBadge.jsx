import PropTypes from "prop-types";

const statusStyles = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  archived: "bg-yellow-100 text-yellow-800",
  planned: "bg-purple-100 text-purple-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  graduated: "bg-emerald-100 text-emerald-800",
  dropped_out: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${style}`}
    >
      {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
