import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "SPORT_ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    if (user.role === "CAPTAIN") {
      return <Navigate to="/captain" replace />;
    }

    if (user.role === "VICE_CAPTAIN") {
      return <Navigate to="/vice-captain" replace />;
    }

    return <Navigate to="/student" replace />;
  }

  return children;
}

export default ProtectedRoute;