// ===================================================
// Auth Utilities - Quản lý token & thông tin user
// ===================================================

// Tách biệt hai bộ khóa để tránh xung đột đè phiên đăng nhập
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";

const CLIENT_TOKEN_KEY = "client_token";
const CLIENT_USER_KEY = "client_user";

// Hàm hỗ trợ động xác định khóa dựa trên đường dẫn URL hiện tại
const getKeys = () => {
  const isAdminPath = window.location.pathname.startsWith('/admin');
  return {
    tokenKey: isAdminPath ? ADMIN_TOKEN_KEY : CLIENT_TOKEN_KEY,
    userKey: isAdminPath ? ADMIN_USER_KEY : CLIENT_USER_KEY
  };
};

// Lưu token vào localStorage
export const saveToken = (token) => {
  const {
    tokenKey
  } = getKeys();
  localStorage.setItem(tokenKey, token);
};

// Lấy token từ localStorage (Ưu tiên token tương ứng với trang đang truy cập)
export const getToken = () => {
  if (window.location.pathname.startsWith('/admin')) {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  // Ở client, nếu có client_token thì lấy, không thì fallback sang admin_token (để admin duyệt client vẫn thấy phiên)
  return localStorage.getItem(CLIENT_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
};

// Lưu thông tin user
export const saveUser = (user) => {
  const {
    userKey
  } = getKeys();
  localStorage.setItem(userKey, JSON.stringify(user));
};

// Lấy thông tin user
export const getUser = () => {
  try {
    if (window.location.pathname.startsWith('/admin')) {
      const raw = localStorage.getItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    // Ở client: Ưu tiên lấy tài khoản khách hàng, nếu không có mới lấy tài khoản admin
    const clientRaw = localStorage.getItem(CLIENT_USER_KEY);
    if (clientRaw) return JSON.parse(clientRaw);

    const adminRaw = localStorage.getItem(ADMIN_USER_KEY);
    return adminRaw ? JSON.parse(adminRaw) : null;
  } catch {
    return null;
  }
};

// Xóa token & user (logout)
export const clearAuth = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(CLIENT_TOKEN_KEY);
  localStorage.removeItem(CLIENT_USER_KEY);
};

// Kiểm tra đã đăng nhập chưa
export const isLoggedIn = () => {
  return !!getToken();
};

// Kiểm tra user có phải Admin/quản trị viên không
// Luôn kiểm tra chính xác bộ khóa admin_user bất kể đang ở URL nào
export const isAdmin = () => {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return false;
    const user = JSON.parse(raw);
    return !!user.role_id;
  } catch {
    return false;
  }
};