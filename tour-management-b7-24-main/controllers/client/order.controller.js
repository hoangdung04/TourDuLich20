import Order from "../../models/order.model.js";
import OrderItem from "../../models/order-item.model.js";
import sequelize from "../../config/database.js";
import {
  QueryTypes
} from "sequelize";
import Tour from "../../models/tour.model.js";
import {
  generateOrderCode
} from "../../helpers/generate.helper.js";
import {
  autoCompleteExpiredToursAndOrders
} from "../../helpers/auto-update.helper.js";
import { PayOS } from "@payos/node";

export const index = async (req, res) => {
  try {
    // Tự động quét và gia hạn các tour quá hạn trước khi tạo đơn hàng mới
    await autoCompleteExpiredToursAndOrders();
  } catch (err) {
    console.error("Auto-update expired tours failed:", err);
  }

  const t = await sequelize.transaction();
  try {
    const info = req.body.info;
    const cart = req.body.cart;
    const paymentMethod = req.body.paymentMethod || "cash"; // "cash" | "bank_transfer"

    // Trạng thái phụ thuộc phương thức thanh toán
    const orderStatus = "initial"; // Luôn bắt đầu bằng initial (Đang chờ thanh toán)

    const dataOrder = {
      code: "",
      fullName: info.fullName,
      phone: info.phone,
      note: info.note,
      account_id: info.account_id || null,
      status: orderStatus,
      paymentMethod: paymentMethod,
    };
    const order = await Order.create(dataOrder, {
      transaction: t
    });
    const orderId = order.dataValues.id;
    const code = generateOrderCode(orderId);
    await Order.update({
      code
    }, {
      where: {
        id: orderId
      },
      transaction: t
    });

    let totalAmount = 0;
    for (const item of cart) {
      const adultsQuantity = parseInt(item.adultsQuantity) || 0;
      const childrenQuantity = parseInt(item.childrenQuantity) || 0;
      const toddlersQuantity = parseInt(item.toddlersQuantity) || 0;
      const infantsQuantity = parseInt(item.infantsQuantity) || 0;
      const seniorsQuantity = parseInt(item.seniorsQuantity) || 0;
      const visaQuantity = parseInt(item.visaQuantity) || 0;
      const singleRoomQuantity = parseInt(item.singleRoomQuantity) || 0;

      const totalTravelers = adultsQuantity + childrenQuantity + toddlersQuantity + infantsQuantity + seniorsQuantity;
      const totalSeats = adultsQuantity + childrenQuantity + toddlersQuantity + seniorsQuantity; // Trẻ sơ sinh không chiếm ghế, người già có chiếm ghế

      const dataItem = {
        orderId: orderId,
        tourId: item.tourId,
        quantity: totalTravelers,
        adultsQuantity,
        childrenQuantity,
        toddlersQuantity,
        infantsQuantity,
        seniorsQuantity,
        visaQuantity,
        singleRoomQuantity
      };

      // Lấy thông tin tour (lock row để tránh race condition)
      const tourInfo = await Tour.findOne({
        where: {
          id: item.tourId,
          deleted: false,
          status: "active"
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!tourInfo) {
        await t.rollback();
        return res.status(400).json({
          error: `Tour ID ${item.tourId} không tồn tại hoặc đã ngừng bán.`
        });
      }

      // Kiểm tra stock
      if (tourInfo.stock !== null && tourInfo.stock < totalSeats) {
        await t.rollback();
        return res.status(400).json({
          error: `Tour "${tourInfo.title}" chỉ còn ${tourInfo.stock} chỗ, không đủ cho ${totalSeats} người.`,
        });
      }

      // Trừ stock
      await Tour.update({
        stock: sequelize.literal(`stock - ${parseInt(totalSeats)}`)
      }, {
        where: {
          id: item.tourId
        },
        transaction: t
      });

      const priceSpecial = Math.round(tourInfo.price * (1 - tourInfo.discount / 100));
      const adultsPrice = priceSpecial * adultsQuantity;
      const childrenPrice = Math.round(priceSpecial * 0.7) * childrenQuantity;
      const toddlersPrice = Math.round(priceSpecial * 0.5) * toddlersQuantity;
      const infantsPrice = 0; // Trẻ sơ sinh được miễn phí vé
      const seniorsPrice = Math.round(priceSpecial * 0.6) * seniorsQuantity; // Người cao tuổi được giảm 40% (tính 60%)
      const visaPrice = 1500000 * visaQuantity;
      const singleRoomPrice = 3500000 * singleRoomQuantity;

      const itemTotalAmount = adultsPrice + childrenPrice + toddlersPrice + infantsPrice + seniorsPrice + visaPrice + singleRoomPrice;
      totalAmount += itemTotalAmount;

      dataItem["price"] = tourInfo.price;
      dataItem["discount"] = tourInfo.discount;
      dataItem["timeStart"] = tourInfo.timeStart;
      await OrderItem.create(dataItem, {
        transaction: t
      });
    }

    await t.commit();

    if (paymentMethod === "bank_transfer") {
      try {
        const payos = new PayOS({
          clientId: process.env.PAYOS_CLIENT_ID,
          apiKey: process.env.PAYOS_API_KEY,
          checksumKey: process.env.PAYOS_CHECKSUM_KEY,
        });

        const paymentData = {
          orderCode: orderId,
          amount: totalAmount,
          description: `Thanh toan don ${code}`.slice(0, 25),
          cancelUrl: `http://localhost:5173/order/history`,
          returnUrl: `http://localhost:5173/order/success?orderCode=${code}`,
        };

        const paymentLink = await payos.paymentRequests.create(paymentData);

        return res.json({
          code: "success",
          message: "Đặt hàng thành công! Đang chuyển hướng thanh toán...",
          orderCode: code,
          checkoutUrl: paymentLink.checkoutUrl
        });
      } catch (payosError) {
        console.error("PayOS Error, rolling back order:", payosError);
        
        // Hủy đơn hàng và cộng trả lại stock
        const orderItems = await OrderItem.findAll({ where: { orderId } });
        for (const item of orderItems) {
          const seats = (item.adultsQuantity || 0) + (item.childrenQuantity || 0) + (item.toddlersQuantity || 0) + (item.seniorsQuantity || 0);
          await Tour.update(
            { stock: sequelize.literal(`stock + ${seats}`) },
            { where: { id: item.tourId } }
          );
        }
        await Order.destroy({ where: { id: orderId } });
        await OrderItem.destroy({ where: { orderId } });

        return res.status(500).json({
          error: "Không thể tạo liên kết thanh toán PayOS. Vui lòng thử lại sau."
        });
      }
    }

    res.json({
      code: "success",
      message: "Đặt hàng thành công!",
      orderCode: code
    });
  } catch (error) {
    await t.rollback();
    console.error("Order error:", error);
    res.status(500).json({
      error: "Lỗi server"
    });
  }
};

export const success = async (req, res) => {
  try {
    let orderCode = req.query.orderCode;
    console.log("=== API ORDER SUCCESS ===");
    console.log("Query orderCode nhận được:", req.query.orderCode);

    // Xử lý nếu orderCode là Array (do trùng lặp tham số query từ PayOS)
    if (Array.isArray(orderCode)) {
      orderCode = orderCode.find(c => String(c).startsWith("OD")) || orderCode[0];
    }

    const whereCondition = { deleted: false };
    if (isNaN(orderCode)) {
      whereCondition.code = orderCode;
    } else {
      whereCondition.id = parseInt(orderCode);
    }
    console.log("Điều kiện tìm kiếm đơn hàng:", whereCondition);

    let order = await Order.findOne({
      where: whereCondition,
      raw: true
    });

    // Fallback: nếu orderCode là số >= 10000, có thể là PayOS orderCode (format: orderId * 10000 + suffix)
    if (!order && !isNaN(orderCode) && parseInt(orderCode) >= 10000) {
      const decodedId = Math.floor(parseInt(orderCode) / 10000);
      console.log(`Thử giải mã PayOS orderCode ${orderCode} → orderId: ${decodedId}`);
      order = await Order.findOne({
        where: { id: decodedId, deleted: false },
        raw: true
      });
    }

    console.log("Kết quả tìm kiếm đơn hàng:", order);

    if (!order) {
      console.log("❌ Không tìm thấy đơn hàng tương ứng.");
      return res.status(404).json({
        error: "Đơn hàng không tồn tại"
      });
    } else {
      // Kiểm tra params PayOS trả về khi redirect: nếu status=PAID & cancel=false → cập nhật trạng thái
      const payosStatus = req.query.status;
      const payosCancel = req.query.cancel;
      const payosCode = req.query.code;
      if (
        order.status === "initial" &&
        (payosStatus === "PAID" || payosCode === "00") &&
        payosCancel !== "true"
      ) {
        await Order.update(
          { status: "paid", paymentMethod: "bank_transfer" },
          { where: { id: order.id } }
        );
        order.status = "paid";
        order.paymentMethod = "bank_transfer";
        console.log(`✅ Đơn hàng ${order.code} đã được cập nhật thành 'paid' từ PayOS return URL.`);

        // Gửi thông báo real-time qua Socket.io
        if (global._io) {
          global._io.emit("PAYMENT_SUCCESS", {
            orderCode: order.code,
            orderId: order.id,
            status: "paid"
          });
        }
      }
      const ordersItem = await OrderItem.findAll({
        where: {
          orderId: order["id"]
        },
        raw: true
      });
      for (const item of ordersItem) {
        const priceSpecial = Math.round(item["price"] * (1 - item["discount"] / 100));
        item["price_special"] = priceSpecial;
        
        const adultsPrice = priceSpecial * (item["adultsQuantity"] || 0);
        const childrenPrice = Math.round(priceSpecial * 0.7) * (item["childrenQuantity"] || 0);
        const toddlersPrice = Math.round(priceSpecial * 0.5) * (item["toddlersQuantity"] || 0);
        const infantsPrice = 0; // Trẻ sơ sinh miễn phí
        const seniorsPrice = Math.round(priceSpecial * 0.6) * (item["seniorsQuantity"] || 0); // Người cao tuổi giảm 40%
        const visaPrice = 1500000 * (item["visaQuantity"] || 0);
        const singleRoomPrice = 3500000 * (item["singleRoomQuantity"] || 0);

        item["total"] = adultsPrice + childrenPrice + toddlersPrice + infantsPrice + seniorsPrice + visaPrice + singleRoomPrice;
        
        const tourInfo = await Tour.findOne({
          where: {
            id: item["tourId"]
          },
          raw: true
        });
        if (tourInfo) {
          try {
            tourInfo["images"] = JSON.parse(tourInfo["images"]);
          } catch (e) {
            tourInfo["images"] = [];
          }
          item["image"] = tourInfo["images"] && tourInfo["images"].length > 0 ? tourInfo["images"][0] : "";
          item["title"] = tourInfo["title"];
          item["slug"] = tourInfo["slug"];
        } else {
          item["image"] = "";
          item["title"] = "Tour không tồn tại hoặc đã bị xóa";
          item["slug"] = "";
        }
      }
      order["total_price"] = ordersItem.reduce((sum, item) => sum + item["total"], 0);
      res.json({
        order,
        ordersItem
      });
    }
  } catch (error) {
    console.error("Lỗi API success:", error);
    res.status(500).json({
      error: "Lỗi server"
    });
  }
};

export const history = async (req, res) => {
  try {
    // Tự động quét và cập nhật trạng thái các tour/đơn hàng quá hạn khởi hành
    await autoCompleteExpiredToursAndOrders();

    const account_id = req.user.id;
    const orders = await Order.findAll({
      where: {
        account_id,
        deleted: false
      },
      order: [
        ['createdAt', 'DESC']
      ],
      raw: true,
    });

    const orderStats = await sequelize.query(`
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
      WHERE o.account_id = :accountId AND o.deleted = false
      GROUP BY o.id
    `, {
      type: QueryTypes.SELECT,
      replacements: {
        accountId: account_id
      }
    });

    for (const order of orders) {
      const stat = orderStats.find(s => s.orderId === order.id);
      order.totalTours = stat ? stat.totalTours : 0;
      order.total_price = stat ? stat.total_price : 0;
    }

    res.json({
      code: "success",
      orders
    });
  } catch (error) {
    res.status(500).json({
      error: "Lỗi server"
    });
  }
};

// [PATCH] /api/order/:id/cancel – Khách hàng hủy đơn (bản rút gọn siêu tốc)
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // 1. Tìm các Tour trong đơn và cộng trả lại chỗ trống (stock)
    const orderItems = await OrderItem.findAll({
      where: {
        orderId
      }
    });
    for (const item of orderItems) {
      const seats = (item.adultsQuantity || 0) + (item.childrenQuantity || 0) + (item.toddlersQuantity || 0) + (item.seniorsQuantity || 0);
      await Tour.update({
        stock: sequelize.literal(`stock + ${seats}`)
      }, {
        where: {
          id: item.tourId
        }
      });
    }

    // 2. Chuyển trạng thái đơn hàng sang "cancelled" (Đã hủy)
    await Order.update({
      status: "cancelled"
    }, {
      where: {
        id: orderId
      }
    });

    res.json({
      code: "success",
      message: "Hủy đặt tour thành công, chỗ trống đã được hoàn trả!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Lỗi server"
    });
  }
};

// [POST] /api/order/payos-webhook – Callback tự động từ PayOS khi thanh toán thành công
export const payosWebhook = async (req, res) => {
  try {
    console.log("=== NHẬN WEBHOOK TỪ PAYOS ===");
    console.log("PAYOS_CLIENT_ID đang dùng:", process.env.PAYOS_CLIENT_ID);
    console.log("PAYOS_CHECKSUM_KEY đang dùng:", process.env.PAYOS_CHECKSUM_KEY ? "ĐÃ CÓ (Độ dài: " + process.env.PAYOS_CHECKSUM_KEY.length + ")" : "CHƯA CÓ");
    console.log("Webhook body thô:", JSON.stringify(req.body, null, 2));

    const payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    });

    const webhookBody = req.body;
    
    // Xác thực chữ ký webhook từ PayOS
    const webhookData = await payos.webhooks.verify(webhookBody);
    console.log("Verified PayOS Webhook Data:", webhookData);

    const payosOrderCode = webhookData.orderCode;
    // Giải mã orderId: nếu orderCode >= 10000 thì dùng format mới (orderId * 10000 + suffix)
    // Nếu < 10000 thì đó là orderId trực tiếp (format cũ)
    let orderId = payosOrderCode;
    if (payosOrderCode >= 10000) {
      orderId = Math.floor(payosOrderCode / 10000);
    }

    let order = await Order.findOne({
      where: { id: orderId, deleted: false }
    });

    // Fallback: thử tìm trực tiếp bằng payosOrderCode (backward compatibility)
    if (!order) {
      order = await Order.findOne({
        where: { id: payosOrderCode, deleted: false }
      });
    }

    if (!order) {
      console.log(`❌ Không tìm thấy đơn hàng ID: ${orderId} (PayOS orderCode: ${payosOrderCode})`);
      // Trả về 200 để PayOS xác nhận webhook thành công (đặc biệt khi PayOS test với đơn hàng ảo ID 123)
      return res.json({ code: "success", message: "Đơn hàng không tồn tại" });
    }

    // Chỉ cập nhật trạng thái nếu đơn hàng hiện tại đang là "initial"
    if (order.status === "initial") {
      await Order.update({ status: "paid" }, { where: { id: order.id } });
      console.log(`✅ Đơn hàng ${order.code} đã thanh toán thành công qua PayOS.`);

      // Gửi thông báo real-time qua Socket.io tới Client
      if (global._io) {
        global._io.emit("PAYMENT_SUCCESS", {
          orderCode: order.code,
          orderId: order.id,
          status: "paid"
        });
      }
    }

    return res.json({ code: "success", message: "Webhook processed successfully" });
  } catch (error) {
    console.error("PayOS Webhook Verification Error:", error);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }
};

// [POST] /api/order/:id/simulate-payment – Giả lập thanh toán thành công (Cho việc phát triển/test trên localhost)
export const simulatePayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({
      where: {
        id: orderId,
        deleted: false
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    if (order.status === "initial") {
      await Order.update({ status: "paid" }, { where: { id: orderId } });
      console.log(`[SIMULATE] Đơn hàng ${order.code} đã được thanh toán (giả lập).`);

      // Gửi thông báo real-time qua Socket.io tới Client
      if (global._io) {
        global._io.emit("PAYMENT_SUCCESS", {
          orderCode: order.code,
          orderId: order.id,
          status: "paid"
        });
      }
    }

    return res.json({
      code: "success",
      message: "Giả lập thanh toán thành công, thông báo đã được gửi đi!"
    });
  } catch (error) {
    console.error("Simulation error:", error);
    return res.status(500).json({ error: "Lỗi server" });
  }
};

// [POST] /api/order/:id/payment-link – Tạo link thanh toán PayOS mới cho đơn hàng hiện có (Đang chờ thanh toán)
export const createPaymentLink = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({
      where: {
        id: orderId,
        account_id: req.user.id,
        deleted: false
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Đơn hàng không tồn tại" });
    }

    // Chỉ cho phép tạo link thanh toán khi đơn hàng ở trạng thái 'initial' hoặc 'Khởi tạo'
    if (order.status !== "initial" && order.status !== "Khởi tạo") {
      return res.status(400).json({ error: "Đơn hàng đã được thanh toán hoặc đã bị hủy" });
    }

    // Cập nhật phương thức thanh toán sang chuyển khoản khi dùng PayOS
    await Order.update(
      { paymentMethod: "bank_transfer" },
      { where: { id: order.id } }
    );

    // Lấy chi tiết đơn hàng để tính tổng tiền
    const ordersItem = await OrderItem.findAll({
      where: { orderId: order.id }
    });

    let totalAmount = 0;
    for (const item of ordersItem) {
      const priceSpecial = Math.round(item.price * (1 - item.discount / 100));
      const adultsPrice = priceSpecial * (item.adultsQuantity || 0);
      const childrenPrice = Math.round(priceSpecial * 0.7) * (item.childrenQuantity || 0);
      const toddlersPrice = Math.round(priceSpecial * 0.5) * (item.toddlersQuantity || 0);
      const infantsPrice = 0; // Trẻ sơ sinh miễn phí
      const seniorsPrice = Math.round(priceSpecial * 0.6) * (item.seniorsQuantity || 0); // Người cao tuổi giảm 40%
      const visaPrice = 1500000 * (item.visaQuantity || 0);
      const singleRoomPrice = 3500000 * (item.singleRoomQuantity || 0);
      totalAmount += (adultsPrice + childrenPrice + toddlersPrice + infantsPrice + seniorsPrice + visaPrice + singleRoomPrice);
    }

    const payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    });

    // Hủy link thanh toán cũ trên PayOS (nếu có) để tránh lỗi "Order code already exists"
    try {
      await payos.paymentRequests.cancel(order.id);
      console.log(`Đã hủy link thanh toán cũ cho đơn ${order.code} (orderCode: ${order.id})`);
    } catch (e) {
      // Bỏ qua – link có thể chưa tồn tại hoặc đã bị hủy trước đó
    }

    // Tạo orderCode mới duy nhất cho mỗi lần thanh toán
    // Format: orderId * 10000 + 4 chữ số cuối timestamp → đảm bảo unique
    const payosOrderCode = order.id * 10000 + (Date.now() % 10000);

    const paymentData = {
      orderCode: payosOrderCode,
      amount: totalAmount,
      description: `Thanh toan don ${order.code}`.slice(0, 25),
      cancelUrl: `http://localhost:5173/order/history`,
      returnUrl: `http://localhost:5173/order/success?orderCode=${order.code}`,
    };

    const paymentLinkRes = await payos.paymentRequests.create(paymentData);
    const checkoutUrl = paymentLinkRes.checkoutUrl;

    return res.json({
      code: "success",
      checkoutUrl: checkoutUrl
    });
  } catch (error) {
    console.error("Lỗi tạo link thanh toán PayOS:", error);
    return res.status(500).json({ 
      error: "Lỗi tạo link thanh toán PayOS",
      details: error.message || JSON.stringify(error) 
    });
  }
};