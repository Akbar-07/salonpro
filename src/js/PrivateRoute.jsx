import { Navigate } from "react-router-dom";
import { getAccessToken, getUser } from "../api";

// allowedRoles: e.g. ["master","admin","boss"] — empty means any authenticated user
export default function PrivateRoute({ children, allowedRoles = [] }) {
  const token = getAccessToken();
  const user  = getUser();

  if (!token || !user) return <Navigate to="/login" replace />;

  // superadmin bypasses all role checks
  if (user.is_super_admin) return children;

  if (allowedRoles.length === 0) return children;

  const role = user.role || "";
  if (allowedRoles.includes(role)) return children;

  // master_admin can access /admin even though role=master
  if (user.is_master_admin && allowedRoles.some(r => ["admin","boss"].includes(r))) return children;

  // redirect to appropriate page based on role
  if (role === "admin" || role === "boss") return <Navigate to="/admin"   replace />;
  if (role === "master")                   return <Navigate to="/masters" replace />;
  return <Navigate to="/" replace />;
}
