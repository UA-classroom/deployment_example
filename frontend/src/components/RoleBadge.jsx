import PropTypes from "prop-types";

const roleStyles = {
  admin: "bg-primary-100 text-primary-700",
  utbildningsledare: "bg-blue-100 text-blue-800",
  student: "bg-green-100 text-green-800",
};

export default function RoleBadge({ role }) {
  const style = roleStyles[role] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${style}`}
    >
      {role}
    </span>
  );
}

RoleBadge.propTypes = {
  role: PropTypes.string.isRequired,
};
