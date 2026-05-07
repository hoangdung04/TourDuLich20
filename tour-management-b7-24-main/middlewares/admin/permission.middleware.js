/**
 * Middleware: Kiểm tra quyền (Authorization)
 * 
 * Danh sách permissions trong hệ thống:
 * 
 * TOURS:
 *   tours_view       - Xem danh sách tour
 *   tours_create     - Tạo tour mới
 *   tours_edit       - Sửa tour
 *   tours_delete     - Xóa tour
 * 
 * CATEGORIES:
 *   categories_view    - Xem danh mục
 *   categories_create  - Tạo danh mục mới
 *   categories_edit    - Sửa danh mục
 *   categories_delete  - Xóa danh mục
 * 
 * ACCOUNTS:
 *   accounts_view    - Xem danh sách tài khoản
 *   accounts_create  - Tạo tài khoản
 *   accounts_edit    - Sửa tài khoản
 *   accounts_delete  - Xóa tài khoản
 * 
 * ROLES:
 *   roles_view       - Xem vai trò
 *   roles_create     - Tạo vai trò
 *   roles_edit       - Sửa vai trò
 *   roles_delete     - Xóa vai trò
 *   roles_permissions - Phân quyền
 * 
 * ORDERS:
 *   orders_view      - Xem đơn hàng
 *   orders_edit      - Cập nhật đơn hàng
 *   orders_delete    - Xóa đơn hàng
 * 
 * Sử dụng: checkPermission("tours_create")
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    // Nếu user không có role → không có quyền gì
    if (!req.role) {
      return res.status(403).json({
        code: "forbidden",
        message: "Tài khoản chưa được gán vai trò"
      });
    }

    const permissions = req.role.permissions || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        code: "forbidden",
        message: `Bạn không có quyền thực hiện hành động này (cần quyền: ${permission})`
      });
    }

    next();
  };
};

/**
 * Kiểm tra nhiều quyền cùng lúc (user phải có TẤT CẢ các quyền)
 * Sử dụng: checkPermissions(["tours_view", "tours_edit"])
 */
export const checkPermissions = (permissionList) => {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(403).json({
        code: "forbidden",
        message: "Tài khoản chưa được gán vai trò"
      });
    }

    const permissions = req.role.permissions || [];
    const missing = permissionList.filter(p => !permissions.includes(p));

    if (missing.length > 0) {
      return res.status(403).json({
        code: "forbidden",
        message: `Bạn không có đủ quyền. Thiếu: ${missing.join(", ")}`
      });
    }

    next();
  };
};
