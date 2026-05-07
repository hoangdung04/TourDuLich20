import Order from "../../models/order.model.js";
import OrderItem from "../../models/order-item.model.js";
import Tour from "../../models/tour.model.js";
import { generateOrderCode } from "../../helpers/generate.helper.js";

export const index = async (req, res) => {
  try {
    const info = req.body.info;
    const cart = req.body.cart;
    const dataOrder = {
      code: "", fullName: info.fullName, phone: info.phone, note: info.note, status: "initial",
    };
    const order = await Order.create(dataOrder);
    const orderId = order.dataValues.id;
    const code = generateOrderCode(orderId);
    await Order.update({ code }, { where: { id: orderId } });

    for (const item of cart) {
      const dataItem = { orderId: orderId, tourId: item.tourId, quantity: item.quantity };
      const tourInfo = await Tour.findOne({ where: { id: item.tourId, deleted: false, status: "active" }, raw: true });
      dataItem["price"] = tourInfo["price"];
      dataItem["discount"] = tourInfo["discount"];
      dataItem["timeStart"] = tourInfo["timeStart"];
      await OrderItem.create(dataItem);
    }
    res.json({ code: "success", message: "Đặt hàng thành công!", orderCode: code });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const success = async (req, res) => {
  try {
    const orderCode = req.query.orderCode;
    const order = await Order.findOne({ where: { code: orderCode, deleted: false }, raw: true });
    if (!order) {
      res.status(404).json({ error: "Đơn hàng không tồn tại" });
    } else {
      const ordersItem = await OrderItem.findAll({ where: { orderId: order["id"] }, raw: true });
      for (const item of ordersItem) {
        item["price_special"] = (item["price"] * (1 - item["discount"] / 100));
        item["total"] = item["price_special"] * item["quantity"];
        const tourInfo = await Tour.findOne({ where: { id: item["tourId"] }, raw: true });
        tourInfo["images"] = JSON.parse(tourInfo["images"]);
        item["image"] = tourInfo["images"][0];
        item["title"] = tourInfo["title"];
        item["slug"] = tourInfo["slug"];
      }
      order["total_price"] = ordersItem.reduce((sum, item) => sum + item["total"], 0);
      res.json({ order, ordersItem });
    }
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
