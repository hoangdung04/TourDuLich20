import Account from "../../models/account.model.js";
import OtpVerify from "../../models/otp.model.js";
import {
  generateToken,
  hashPassword,
  comparePassword
} from "../../helpers/generate.helper.js";
import { sendMail, getOtpEmailTemplate } from "../../helpers/sendMail.helper.js";

// [POST] /api/client/auth/register - Đăng ký tài khoản người dùng (gửi OTP)
export const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone
    } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existing = await Account.findOne({
      where: {
        email,
        deleted: false
      }
    });

    if (existing) {
      if (existing.status === "active") {
        return res.status(400).json({
          code: "error",
          message: "Email này đã được sử dụng"
        });
      }

      // Nếu đã đăng ký nhưng ở trạng thái pending, cập nhật lại thông tin mới
      const hashedPassword = hashPassword(password);
      const token = generateToken();

      await existing.update({
        fullName,
        password: hashedPassword,
        token,
        phone: phone || null,
      });
    } else {
      // Tạo tài khoản mới ở trạng thái pending
      const hashedPassword = hashPassword(password);
      const token = generateToken();

      await Account.create({
        fullName,
        email,
        password: hashedPassword,
        token,
        phone: phone || null,
        role_id: null,
        status: "pending",
        deleted: false,
      });
    }

    // Tạo mã OTP xác thực
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = new Date(Date.now() + 3 * 60 * 1000); // Hạn 3 phút

    // Lưu OTP vào DB
    await OtpVerify.create({
      email,
      otp,
      expireAt
    });

    // Gửi email xác thực
    const htmlContent = getOtpEmailTemplate(fullName, otp, "register");
    try {
      await sendMail(email, "Xác nhận đăng ký tài khoản TourVN", htmlContent);
    } catch (mailError) {
      console.error("Gửi email đăng ký thất bại, OTP phục vụ dev:", otp);
    }

    return res.json({
      code: "otp_sent",
      message: "Mã OTP xác thực đã được gửi về email của bạn. Vui lòng kiểm tra!",
      email,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};

// [POST] /api/client/auth/login - Đăng nhập người dùng thường
export const login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    // Tìm tài khoản theo email
    const user = await Account.findOne({
      where: {
        email,
        deleted: false,
        status: "active"
      },
    });

    if (!user) {
      return res.status(401).json({
        code: "error",
        message: "Email không tồn tại hoặc tài khoản bị khóa"
      });
    }
    if (user.role_id !== null) {
      return res.status(403).json({
        code: "error",
        message: "Tài khoản quản trị không được phép đăng nhập tại cổng dành cho khách hàng!"
      });
    }
    // So sánh mật khẩu
    if (!comparePassword(password, user.password)) {
      return res.status(401).json({
        code: "error",
        message: "Mật khẩu không đúng"
      });
    }

    // Tạo token mới và lưu vào DB
    const token = generateToken();
    await user.update({
      token
    });

    return res.json({
      code: "success",
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role_id: user.role_id, // null nếu là người dùng thường
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};

// [POST] /api/client/auth/logout - Đăng xuất người dùng
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ?
      authHeader.slice(7) :
      null;

    if (token) {
      // Xóa token trong DB để vô hiệu hóa phiên đăng nhập
      await Account.update({
        token: null
      }, {
        where: {
          token
        }
      });
    }

    return res.json({
      code: "success",
      message: "Đăng xuất thành công"
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};

// [POST] /api/auth/change-password - Đổi mật khẩu (cần đăng nhập)
export const changePassword = async (req, res) => {
  try {
    const {
      oldPassword,
      newPassword
    } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: "error",
        message: "Vui lòng nhập đầy đủ thông tin"
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        code: "error",
        message: "Mật khẩu mới tối thiểu 6 ký tự"
      });
    }

    // req.user được gắn bởi requireClientAuth middleware
    const user = await Account.findOne({
      where: {
        id: req.user.id,
        deleted: false
      }
    });
    if (!user) {
      return res.status(404).json({
        code: "error",
        message: "Tài khoản không tồn tại"
      });
    }

    if (!comparePassword(oldPassword, user.password)) {
      return res.status(400).json({
        code: "error",
        message: "Mật khẩu cũ không đúng"
      });
    }

    await Account.update({
      password: hashPassword(newPassword)
    }, {
      where: {
        id: user.id
      }
    });

    return res.json({
      code: "success",
      message: "Đổi mật khẩu thành công!"
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};

// [POST] /api/client/auth/register/verify - Xác thực mã OTP để kích hoạt tài khoản
export const verifyRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        code: "error",
        message: "Vui lòng nhập đầy đủ thông tin email và mã OTP"
      });
    }

    // Tìm bản ghi OTP mới nhất của email này
    const otpRecord = await OtpVerify.findOne({
      where: {
        email,
        otp
      },
      order: [["createdAt", "DESC"]]
    });

    if (!otpRecord) {
      return res.status(400).json({
        code: "error",
        message: "Mã OTP không chính xác"
      });
    }

    // Kiểm tra hết hạn
    if (new Date() > new Date(otpRecord.expireAt)) {
      return res.status(400).json({
        code: "error",
        message: "Mã OTP đã hết hạn, vui lòng yêu cầu gửi lại mã mới"
      });
    }

    // Tìm tài khoản ở trạng thái pending
    const account = await Account.findOne({
      where: {
        email,
        deleted: false,
        status: "pending"
      }
    });

    if (!account) {
      return res.status(404).json({
        code: "error",
        message: "Tài khoản không tồn tại hoặc đã được kích hoạt"
      });
    }

    // Cập nhật trạng thái hoạt động cho tài khoản
    await account.update({
      status: "active"
    });

    // Xóa tất cả mã OTP của email này
    await OtpVerify.destroy({
      where: { email }
    });

    return res.json({
      code: "success",
      message: "Kích hoạt tài khoản thành công!",
      token: account.token,
      user: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        avatar: account.avatar,
        role_id: null,
      }
    });
  } catch (error) {
    console.error("Verify register OTP error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};

// [POST] /api/client/auth/password/forgot - Gửi yêu cầu quên mật khẩu
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        code: "error",
        message: "Vui lòng nhập email"
      });
    }

    // Tìm tài khoản hoạt động khớp với email
    const account = await Account.findOne({
      where: {
        email,
        deleted: false,
        status: "active"
      }
    });

    if (!account) {
      return res.status(404).json({
        code: "error",
        message: "Email không tồn tại trong hệ thống hoặc tài khoản chưa được kích hoạt"
      });
    }

    // Sinh mã OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = new Date(Date.now() + 3 * 60 * 1000); // Hạn 3 phút

    await OtpVerify.create({
      email,
      otp,
      expireAt
    });

    // Gửi email OTP khôi phục mật khẩu
    const htmlContent = getOtpEmailTemplate(account.fullName, otp, "forgot");
    try {
      await sendMail(email, "Khôi phục mật khẩu tài khoản TourVN", htmlContent);
    } catch (mailError) {
      console.error("Gửi email forgot password thất bại, OTP phục vụ dev:", otp);
    }

    return res.json({
      code: "otp_sent",
      message: "Mã OTP đặt lại mật khẩu đã được gửi về email của bạn.",
      email
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};

// [POST] /api/client/auth/password/reset - Xác thực OTP và đặt lại mật khẩu mới
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        code: "error",
        message: "Vui lòng điền đầy đủ thông tin"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: "error",
        message: "Mật khẩu mới tối thiểu phải có 6 ký tự"
      });
    }

    // Kiểm tra OTP
    const otpRecord = await OtpVerify.findOne({
      where: {
        email,
        otp
      },
      order: [["createdAt", "DESC"]]
    });

    if (!otpRecord) {
      return res.status(400).json({
        code: "error",
        message: "Mã OTP không chính xác"
      });
    }

    if (new Date() > new Date(otpRecord.expireAt)) {
      return res.status(400).json({
        code: "error",
        message: "Mã OTP đã hết hạn, vui lòng yêu cầu gửi lại mã mới"
      });
    }

    // Tìm tài khoản
    const account = await Account.findOne({
      where: {
        email,
        deleted: false,
        status: "active"
      }
    });

    if (!account) {
      return res.status(404).json({
        code: "error",
        message: "Tài khoản không tồn tại hoặc đã bị khóa"
      });
    }

    // Mã hóa mật khẩu mới và sinh mới token
    const hashedPassword = hashPassword(password);
    const newToken = generateToken();

    await account.update({
      password: hashedPassword,
      token: newToken // thay đổi token để hủy phiên đăng nhập cũ
    });

    // Xóa mã OTP
    await OtpVerify.destroy({
      where: { email }
    });

    return res.json({
      code: "success",
      message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};

// [POST] /api/client/auth/otp/resend - Gửi lại mã OTP
export const resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'register' hoặc 'forgot'

    if (!email || !type) {
      return res.status(400).json({
        code: "error",
        message: "Thiếu thông tin gửi lại mã OTP"
      });
    }

    const account = await Account.findOne({
      where: {
        email,
        deleted: false
      }
    });

    if (!account) {
      return res.status(404).json({
        code: "error",
        message: "Email không tồn tại trong hệ thống"
      });
    }

    if (type === "register" && account.status === "active") {
      return res.status(400).json({
        code: "error",
        message: "Tài khoản này đã được kích hoạt từ trước"
      });
    }

    if (type === "forgot" && account.status !== "active") {
      return res.status(400).json({
        code: "error",
        message: "Tài khoản chưa được kích hoạt hoặc đã bị khóa"
      });
    }

    // Sinh mã OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = new Date(Date.now() + 3 * 60 * 1000); // Hạn 3 phút

    await OtpVerify.create({
      email,
      otp,
      expireAt
    });

    const htmlContent = getOtpEmailTemplate(account.fullName, otp, type);
    const subject = type === "register" ? "Kích hoạt tài khoản TourVN" : "Khôi phục mật khẩu tài khoản TourVN";

    try {
      await sendMail(email, subject, htmlContent);
    } catch (mailError) {
      console.error(`Gửi lại email OTP [${type}] thất bại, OTP phục vụ dev:`, otp);
    }

    return res.json({
      code: "otp_sent",
      message: "Đã gửi lại mã OTP mới về email của bạn.",
      email
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
};