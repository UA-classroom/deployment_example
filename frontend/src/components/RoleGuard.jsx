import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import authStore from "../store/authStore";

export default function RoleGuard({ allowedRoles, children }) {
  const userData = authStore((state) => state.userData);

  if (!userData || !allowedRoles.includes(userData.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

RoleGuard.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};
