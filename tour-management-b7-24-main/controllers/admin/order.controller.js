import Order from "../../models/order.model.js";
import OrderItem from "../../models/order-item.model.js";
import sequelize from "../../config/database.js";
import Tour from "../../models/tour.model.js";
import { autoCompleteExpiredToursAndOrders } from "../../helpers/auto-update.helper.js";

// [GET] /api/admin/orders
export const index = async (req, res) => {
  try {
    // Tự động quét và cập nhật trạng thái các tour/đơn hàng quá hạn khởi hành
    await autoCompleteExpiredToursAndOrders();

    const orders = await Order.findAll({
      where: { deleted: false },
      order: [['createdAt', 'DESC']],
      raw: true,
    });
    
    const [orderStats] = await sequelize.query(`
      SELECT 
        o.id as orderId, 
        COUNT(oi.id) as totalTours, 
        SUM(
          (COALESCE(oi.adultsQuantity, 0) * ROUND(oi.price * (1 - oi.discount / 100))) +
          (COALESCE(oi.childrenQuantity, 0) * ROUND(oi.price * (1 - oi.discount / 100) * 0.7)) +
          (COALESCE(oi.toddlersQuantity, 0) * ROUND(oi.price * (1 - oi.discount / 100) * 0.5)) +
          (0) +
          (COALESCE(oi.seniorsQuantity, 0) * ROUND(oi.price * (1 - oi.discount / 100) * 0.6)) +
          (COALESCE(oi.visaQuantity, 0) * 1500000) +
          (COALESCE(oi.singleRoomQuantity, 0) * 3500000)
        ) as total_price
      FROM orders o
      LEFT JOIN orders_item oi ON o.id = oi.orderId
      WHERE o.deleted = false
      GROUP BY o.id
    `);

    // Ghép số liệu vào danh sách orders
    for (const order of orders) {
      const stat = orderStats.find(s => s.orderId === order.id);
      order.totalTours = stat ? stat.totalTours : 0;
      order.total_price = stat ? stat.total_price : 0;
    }

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [GET] /api/admin/orders/:id – Chi tiết đơn hàng
export const detail = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, deleted: false },
      raw: true,
    });
    if (!order) {
      return res.status(404).json({ code: "error", message: "Không tìm thấy đơn hàng" });
    }

    const ordersItem = await OrderItem.findAll({
      where: { orderId: order.id },
      raw: true,
    });

    for (const item of ordersItem) {
      const priceSpecial = Math.round(item.price * (1 - item.discount / 100));
      item.price_special = priceSpecial;
      
      const adultsPrice = priceSpecial * (item.adultsQuantity || 0);
      const childrenPrice = Math.round(priceSpecial * 0.7) * (item.childrenQuantity || 0);
      const toddlersPrice = Math.round(priceSpecial * 0.5) * (item.toddlersQuantity || 0);
      const infantsPrice = 0; // Trẻ sơ sinh miễn phí
      const seniorsPrice = Math.round(priceSpecial * 0.6) * (item.seniorsQuantity || 0); // Người cao tuổi giảm 40%
      const visaPrice = 1500000 * (item.visaQuantity || 0);
      const singleRoomPrice = 3500000 * (item.singleRoomQuantity || 0);

      item.total = adultsPrice + childrenPrice + toddlersPrice + infantsPrice + seniorsPrice + visaPrice + singleRoomPrice;
      const tourInfo = await Tour.findOne({ where: { id: item.tourId }, raw: true });
      if (tourInfo) {
        item.tourTitle = tourInfo.title;
        item.tourCode  = tourInfo.code;
        item.tourSlug  = tourInfo.slug;
        if (tourInfo.images) {
          const imgs = JSON.parse(tourInfo.images);
          item.tourImage = imgs[0] || null;
        }
      }
    }

    order.total_price = ordersItem.reduce((sum, item) => sum + item.total, 0);

    res.json({ code: "success", order, ordersItem });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [PATCH] /api/admin/orders/:id/status
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Order.update({ status }, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [DELETE] /api/admin/orders/:id – Xóa đơn hàng (soft delete)
export const deletePatch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const orderId = req.params.id;

    // 1. Tìm đơn hàng để kiểm tra trạng thái trước khi xóa
    const order = await Order.findOne({
      where: { id: orderId, deleted: false },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ code: "error", message: "Không tìm thấy đơn hàng" });
    }

    // 2. Nếu đơn hàng chưa ở trạng thái hủy (tức là chưa được trả lại stock), tiến hành hoàn trả stock cho các tour
    if (order.status !== "cancelled") {
      const orderItems = await OrderItem.findAll({
        where: { orderId: orderId },
        transaction: t
      });

      for (const item of orderItems) {
        const seats = (item.adultsQuantity || 0) + (item.childrenQuantity || 0) + (item.toddlersQuantity || 0) + (item.seniorsQuantity || 0);
        await Tour.update(
          { stock: sequelize.literal(`stock + ${seats}`) },
          { 
            where: { id: item.tourId },
            transaction: t
          }
        );
      }
    }

    // 3. Thực hiện xóa mềm đơn hàng
    await Order.update(
      { deleted: true, deletedAt: new Date() },
      { 
        where: { id: orderId },
        transaction: t
      }
    );

    await t.commit();
    res.json({ code: "success", message: "Xóa đơn hàng và hoàn trả chỗ trống thành công" });
  } catch (error) {
    await t.rollback();
    console.error("Delete order error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
