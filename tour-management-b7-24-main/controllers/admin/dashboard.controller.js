import Tour from "../../models/tour.model.js";
import sequelize from "../../config/database.js";
import Order from "../../models/order.model.js";
import Account from "../../models/account.model.js";
import OrderItem from "../../models/order-item.model.js";
import Category from "../../models/category.model.js";
import { autoCompleteExpiredToursAndOrders } from "../../helpers/auto-update.helper.js";

// [GET] /api/admin/dashboard
export const index = async (req, res) => {
  try {
    // Tự động quét và cập nhật trạng thái các tour/đơn hàng quá hạn khởi hành
    await autoCompleteExpiredToursAndOrders();

    const statistic = {
      category: { total: 0, active: 0, inactive: 0 },
      tour: { total: 0, active: 0, inactive: 0 },
      account: { total: 0, active: 0, inactive: 0 },
      order: { total: 0, completed: 0, revenue: 0 }
    };

    // Thống kê Tour
    statistic.tour.total = await Tour.count({ where: { deleted: false } });
    statistic.tour.active = await Tour.count({ where: { status: "active", deleted: false } });
    statistic.tour.inactive = await Tour.count({ where: { status: "inactive", deleted: false } });

    // Thống kê Category
    statistic.category.total = await Category.count({ where: { deleted: false } });
    statistic.category.active = await Category.count({ where: { status: "active", deleted: false } });
    statistic.category.inactive = await Category.count({ where: { status: "inactive", deleted: false } });

    // Thống kê Account
    statistic.account.total = await Account.count({ where: { deleted: false } });
    statistic.account.active = await Account.count({ where: { status: "active", deleted: false } });
    statistic.account.inactive = await Account.count({ where: { status: "inactive", deleted: false } });

    // Thống kê Order
    statistic.order.total = await Order.count({ where: { deleted: false } });
    statistic.order.completed = await Order.count({ where: { status: "completed", deleted: false } });

    // Doanh thu (chỉ tính đơn hoàn thành) - TỐI ƯU HÓA: Gộp chung thành 1 câu SQL (Chuẩn đi làm)
    const [revenueResult] = await sequelize.query(`
      SELECT SUM(oi.quantity * (oi.price * (1 - oi.discount / 100))) as totalRevenue
      FROM orders_item oi
      JOIN orders o ON oi.orderId = o.id
      WHERE o.status = 'completed' AND o.deleted = false
    `);
    
    statistic.order.revenue = revenueResult[0]?.totalRevenue || 0;

    // Lấy 5 đơn hàng mới nhất
    const recentOrders = await Order.findAll({
      where: { deleted: false },
      order: [['createdAt', 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({ code: "success", statistic, recentOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
