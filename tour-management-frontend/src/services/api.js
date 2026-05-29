// ===================================================
// API Service - Gọi API từ backend (port 3001)
// ===================================================
import axios from 'axios';
import {
  getToken,
  clearAuth
} from '../utils/auth';

// Config axios - baseURL trỏ tới backend
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: Tự động gắn Bearer token vào mọi request admin
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Nếu 401 → xóa token, chuyển về trang login tương ứng
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu lỗi 401 và KHÔNG PHẢI đang gọi API đăng nhập (tránh việc báo sai pass bị văng trang)
    if (error.response?.status === 401 && !error.config.url.includes('/login')) {
      clearAuth();
      // Kiểm tra xem đang ở giao diện admin hay client để văng về đúng chỗ
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========================
// CLIENT APIs
// ========================

export const getCategories = () => api.get('/categories');
export const getToursByCategory = (slugCategory) => api.get(`/tours/${slugCategory}`);
export const getTourDetail = (slugTour) => api.get(`/tours/detail/${slugTour}`);
export const getFeaturedTours = () => api.get('/tours/featured');
export const searchTours = (keyword) => api.get(`/tours/search?keyword=${encodeURIComponent(keyword)}`);
export const getToursByCategories = () => api.get('/tours/by-categories');
export const getCartList = (cart) => api.post('/cart/list', cart);
export const createOrder = (data) => api.post('/order', data);
export const getClientOrderHistory = () => api.get('/order/history');
export const getOrderSuccess = (orderCode, payosParams = {}) => {
  const params = new URLSearchParams({ orderCode });
  if (payosParams.status) params.append("status", payosParams.status);
  if (payosParams.code) params.append("code", payosParams.code);
  if (payosParams.cancel) params.append("cancel", payosParams.cancel);
  return api.get(`/order/success?${params.toString()}`);
};
export const cancelClientOrder = (id) => api.patch(`/order/${id}/cancel`);
export const getPaymentLink = (id) => api.post(`/order/${id}/payment-link`);
export const sendAiChatMessage = (message) => api.post('/ai-chat', { message });

// ========================
// CLIENT AUTH APIs (Người dùng thường)
// ========================

export const clientRegister = (data) => api.post('/auth/register', data);
export const clientVerifyOtpRegister = (data) => api.post('/auth/register/verify', data);
export const clientLogin = (data) => api.post('/auth/login', data);
export const clientLogout = () => api.post('/auth/logout');
export const clientChangePassword = (data) => api.post('/auth/change-password', data);
export const clientForgotPassword = (data) => api.post('/auth/password/forgot', data);
export const clientResetPassword = (data) => api.post('/auth/password/reset', data);
export const clientResendOtp = (data) => api.post('/auth/otp/resend', data);

// ========================
// ADMIN AUTH APIs
// ========================

export const adminLogin = (data) => api.post('/admin/auth/login', data);
export const adminLogout = () => api.post('/admin/auth/logout');
export const adminMe = () => api.get('/admin/auth/me');

// ========================
// ADMIN TOURS APIs
// ========================

export const getAdminTours = (params) => api.get('/admin/tours', {
  params
});
export const getAdminTourCategories = () => api.get('/admin/tours/categories');
export const createAdminTour = (formData) => api.post('/admin/tours/create', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const getAdminTourById = (id) => api.get(`/admin/tours/${id}`);
export const updateAdminTour = (id, formData) => api.patch(`/admin/tours/${id}`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const deleteAdminTour = (id) => api.delete(`/admin/tours/${id}`);

// ========================
// ADMIN CATEGORIES APIs
// ========================

export const getAdminCategories = () => api.get('/admin/categories');
export const getAdminCategoryById = (id) => api.get(`/admin/categories/${id}`);
export const createAdminCategory = (formData) => api.post('/admin/categories/create', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const updateAdminCategory = (id, formData) => api.patch(`/admin/categories/${id}`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const deleteAdminCategory = (id) => api.delete(`/admin/categories/${id}`);

// ========================
// ADMIN ROLES APIs
// ========================

export const getAdminRoles = () => api.get('/admin/roles');
export const getAdminRoleById = (id) => api.get(`/admin/roles/${id}`);
export const createAdminRole = (data) => api.post('/admin/roles/create', data);
export const updateAdminRole = (id, data) => api.patch(`/admin/roles/${id}`, data);
export const deleteAdminRole = (id) => api.delete(`/admin/roles/${id}`);
export const getAdminPermissions = () => api.get('/admin/roles/permissions');
export const updateAdminPermissions = (data) => api.patch('/admin/roles/permissions', data);

// ========================
// ADMIN ACCOUNTS APIs
// ========================

export const getAdminAccounts = () => api.get('/admin/accounts');
export const getAdminAccountById = (id) => api.get(`/admin/accounts/${id}`);
export const createAdminAccount = (data) => api.post('/admin/accounts/create', data);
export const updateAdminAccount = (id, data) => api.patch(`/admin/accounts/${id}`, data);
export const deleteAdminAccount = (id) => api.delete(`/admin/accounts/${id}`);

// ========================
// ADMIN ORDERS APIs
// ========================

export const getAdminOrders = () => api.get('/admin/orders');
export const getAdminOrderById = (id) => api.get(`/admin/orders/${id}`);
export const updateAdminOrderStatus = (id, status) => api.patch(`/admin/orders/${id}/status`, {
  status
});
export const deleteAdminOrder = (id) => api.delete(`/admin/orders/${id}`);

// ========================
// ADMIN DASHBOARD APIs
// ========================

export const getAdminDashboard = () => api.get('/admin/dashboard');

// ========================
// CLIENT ARTICLES APIs
// ========================

export const getArticles = (params) => api.get('/articles', { params });
export const getArticleDetail = (slug) => api.get(`/articles/${slug}`);

// ========================
// ADMIN ARTICLES APIs
// ========================

export const getAdminArticles = (params) => api.get('/admin/articles', { params });
export const getAdminArticleById = (id) => api.get(`/admin/articles/${id}`);
export const getAdminArticleTours = () => api.get('/admin/articles/tours');
export const createAdminArticle = (formData) => api.post('/admin/articles/create', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateAdminArticle = (id, formData) => api.patch(`/admin/articles/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteAdminArticle = (id) => api.delete(`/admin/articles/${id}`);

export default api;