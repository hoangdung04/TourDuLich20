import Account from "../../models/account.model.js";

export const requireClientAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ?
      authHeader.slice(7) :
      null;

    if (!token || token === "null" || token === "undefined") {
      console.log("❌ Không tìm thấy token! authHeader:", authHeader);
      return res.status(401).json({
        code: "error",
        message: "Bạn chưa đăng nhập"
      });
    }
    console.log("🔑 Token nhận được:", token);

    const user = await Account.findOne({
      where: {
        token,
        deleted: false,
        status: "active"
      },
      attributes: {
        exclude: ["password"]
      }
    });

    if (!user) return res.status(401).json({
      code: "error",
      message: "Token không hợp lệ"
    });

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Lỗi server xác thực"
    });
  }
};