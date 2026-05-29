// ===================================================
// Cart Utils - Logic giỏ hàng với localStorage
// Chuyển từ: public/js/script.js (phần Giỏ hàng)
// ===================================================
import { getUser } from "./auth";

// Hàm lấy tên key giỏ hàng động dựa trên User ID đang đăng nhập
const getCartKey = () => {
  const user = getUser();
  return user && user.id ? `cart_${user.id}` : "cart_guest";
};

// Khởi tạo giỏ hàng nếu chưa có
export const initCart = () => {
  const key = getCartKey();
  const cart = localStorage.getItem(key);
  if (!cart) {
    localStorage.setItem(key, JSON.stringify([]));
  }
};

// Lấy giỏ hàng từ localStorage
export const getCart = () => {
  const key = getCartKey();
  const cart = localStorage.getItem(key);
  return cart ? JSON.parse(cart) : [];
};

// Lưu giỏ hàng vào localStorage
export const saveCart = (cart) => {
  const key = getCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
};

// Thêm tour vào giỏ hàng (Danh sách đặt chỗ)
export const addToCart = (tourId, details = {}) => {
  const cart = getCart();
  const existItem = cart.find(item => item.tourId === tourId);

  const adultsQuantity = parseInt(details.adultsQuantity) || 1;
  const childrenQuantity = parseInt(details.childrenQuantity) || 0;
  const toddlersQuantity = parseInt(details.toddlersQuantity) || 0;
  const infantsQuantity = parseInt(details.infantsQuantity) || 0;
  const seniorsQuantity = parseInt(details.seniorsQuantity) || 0;
  const visaQuantity = parseInt(details.visaQuantity) || 0;
  const singleRoomQuantity = parseInt(details.singleRoomQuantity) || 0;

  if (existItem) {
    existItem.adultsQuantity = (existItem.adultsQuantity || 0) + adultsQuantity;
    existItem.childrenQuantity = (existItem.childrenQuantity || 0) + childrenQuantity;
    existItem.toddlersQuantity = (existItem.toddlersQuantity || 0) + toddlersQuantity;
    existItem.infantsQuantity = (existItem.infantsQuantity || 0) + infantsQuantity;
    existItem.seniorsQuantity = (existItem.seniorsQuantity || 0) + seniorsQuantity;
    existItem.visaQuantity = (existItem.visaQuantity || 0) + visaQuantity;
    existItem.singleRoomQuantity = (existItem.singleRoomQuantity || 0) + singleRoomQuantity;
  } else {
    cart.push({
      tourId,
      adultsQuantity,
      childrenQuantity,
      toddlersQuantity,
      infantsQuantity,
      seniorsQuantity,
      visaQuantity,
      singleRoomQuantity
    });
  }

  saveCart(cart);
  return cart;
};

// Xóa tour khỏi giỏ hàng
export const removeFromCart = (tourId) => {
  const cart = getCart();
  const newCart = cart.filter(item => item.tourId !== tourId);
  saveCart(newCart);
  return newCart;
};

// Cập nhật số lượng tổng (để giữ tương thích ngược nếu cần)
export const updateCartQuantity = (tourId, quantity) => {
  const cart = getCart();
  const existItem = cart.find(item => item.tourId === tourId);
  if (existItem) {
    // Nếu gọi cập nhật đơn thuần, ta gán quantity cho người lớn, còn lại bằng 0
    existItem.adultsQuantity = quantity;
    existItem.childrenQuantity = 0;
    existItem.toddlersQuantity = 0;
    existItem.infantsQuantity = 0;
    existItem.seniorsQuantity = 0;
    existItem.visaQuantity = 0;
    existItem.singleRoomQuantity = 0;
    saveCart(cart);
  }
  return cart;
};

// Cập nhật chi tiết các trường số lượng / phụ thu của một tour
export const updateCartItemDetails = (tourId, details) => {
  const cart = getCart();
  const existItem = cart.find(item => item.tourId === tourId);
  if (existItem) {
    if (details.adultsQuantity !== undefined) existItem.adultsQuantity = Math.max(1, parseInt(details.adultsQuantity) || 1);
    if (details.childrenQuantity !== undefined) existItem.childrenQuantity = Math.max(0, parseInt(details.childrenQuantity) || 0);
    if (details.toddlersQuantity !== undefined) existItem.toddlersQuantity = Math.max(0, parseInt(details.toddlersQuantity) || 0);
    if (details.infantsQuantity !== undefined) existItem.infantsQuantity = Math.max(0, parseInt(details.infantsQuantity) || 0);
    if (details.seniorsQuantity !== undefined) existItem.seniorsQuantity = Math.max(0, parseInt(details.seniorsQuantity) || 0);
    if (details.visaQuantity !== undefined) existItem.visaQuantity = Math.max(0, parseInt(details.visaQuantity) || 0);
    if (details.singleRoomQuantity !== undefined) existItem.singleRoomQuantity = Math.max(0, parseInt(details.singleRoomQuantity) || 0);
    saveCart(cart);
  }
  return cart;
};

// Đếm số lượng tour trong giỏ hàng (hiển thị mini-cart)
export const getCartCount = () => {
  return getCart().length;
};

// Xóa toàn bộ giỏ hàng (sau khi đặt tour thành công)
export const clearCart = () => {
  saveCart([]);
};
