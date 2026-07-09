import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B1B3D]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user is an admin, they should not access the user portal.
  if (profile?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  // Profile completion redirect logic:
  // If a user has registered but hasn't completed their profile, we force them to /complete-profile.
  // We check location.pathname to avoid an infinite redirect loop if they are already on that page.
  if ((!profile || !profile.profileComplete) && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
}

export default ProtectedRoute;