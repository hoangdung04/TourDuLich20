import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

/**
 * ProtectedRoute – Bảo vệ các trang admin
 * Nếu chưa đăng nhập → redirect về /admin/login
 */
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
