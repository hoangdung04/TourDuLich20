// ===================================================
// Auth Utilities - Quản lý token & thông tin user
// ===================================================

const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";

// Lưu token vào localStorage
export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Lấy token từ localStorage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Lưu thông tin user
export const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Lấy thông tin user
export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Xóa token & user (logout)
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Kiểm tra đã đăng nhập chưa
export const isLoggedIn = () => {
  return !!getToken();
};

// Kiểm tra user có phải Admin/quản trị viên không
// Dựa vào trường role được lưu khi đăng nhập
export const isAdmin = () => {
  const user = getUser();
  if (!user) return false;
  // Nếu user có role_id (đã được gán vai trò) thì là quản trị viên
  return !!user.role_id;
};
