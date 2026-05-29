import { Op } from "sequelize";
import Tour from "../models/tour.model.js";
import Order from "../models/order.model.js";
import OrderItem from "../models/order-item.model.js";

/**
 * Tác vụ tự động quét và gia hạn các Tour định kỳ ( lặp lại hàng tuần )
 * - Cộng thêm 7 ngày vào ngày khởi hành (timeStart) liên tục cho đến khi ở tương lai
 * - Đảm bảo trạng thái Tour được chuyển/giữ là 'active' (Hoạt động) để hiển thị lên client
 * - Reset lại số lượng chỗ trống (stock) về 30 để khách hàng đặt tiếp đợt mới
 * - Chuyển trạng thái các Đơn hàng 'paid' (Đã thanh toán) thuộc đợt đi vừa qua sang 'completed' (Hoàn thành)
 */
export const autoCompleteExpiredToursAndOrders = async () => {
  try {
    const now = new Date();

    // 1. Tìm các Tour có ngày khởi hành (timeStart) đã qua so với hiện tại
    const expiredTours = await Tour.findAll({
      where: {
        timeStart: { [Op.lt]: now },
        deleted: false
      },
      raw: true
    });

    if (expiredTours.length > 0) {
      const tourIds = expiredTours.map(t => t.id);

      // 2. Với từng Tour quá hạn, dời lịch sang tương lai, set trạng thái 'active' và reset stock
      for (const tour of expiredTours) {
        let newTimeStart = new Date(tour.timeStart);
        
        // Cộng thêm 7 ngày liên tục cho đến khi ngày khởi hành nằm ở tương lai
        while (newTimeStart < now) {
          newTimeStart.setDate(newTimeStart.getDate() + 7);
        }

        // Cập nhật lại ngày đi mới, mở trạng thái 'active' và reset chỗ trống
        await Tour.update(
          {
            timeStart: newTimeStart,
            status: "active", // 🌟 Đảm bảo trạng thái luôn là Hoạt động để khách hàng thấy và đặt chỗ
            stock: 30        // Reset chỗ trống về 30
          },
          { where: { id: tour.id } }
        );
      }

      // 3. Tìm các đơn hàng chứa Tour vừa đi xong (chỉ lấy đơn có ngày khởi hành đã qua so với hiện tại)
      const orderItems = await OrderItem.findAll({
        where: {
          tourId: tourIds,
          timeStart: { [Op.lt]: now }
        },
        raw: true
      });

      if (orderItems.length > 0) {
        const orderIds = [...new Set(orderItems.map(item => item.orderId))];

        // 4. Chuyển các đơn hàng từ 'paid' (Đã thanh toán) sang 'completed' (Hoàn thành) để ghi nhận doanh thu
        await Order.update(
          { status: "completed" },
          {
            where: {
              id: orderIds,
              status: "paid",
              deleted: false
            }
          }
        );
      }
      console.log(`[TỰ ĐỘNG GIA HẠN] Đã dời lịch, reset 30 chỗ và kích hoạt 'active' cho ${expiredTours.length} tour quá hạn, đồng thời hoàn thành các đơn hàng liên quan.`);
    }
  } catch (error) {
    console.error("Lỗi khi tự động gia hạn tour định kỳ:", error);
  }
};