import nodemailer from "nodemailer";

/**
 * Hàm gửi mail chung
 * @param {string} email - Email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} htmlContent - Nội dung email định dạng HTML
 */
export const sendMail = (email, subject, htmlContent) => {
  // Tạo transporter kết nối SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Tour Du Lịch Hoàng Dũng" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Nodemailer Error: ", error);
        reject(error);
      } else {
        console.log("Email gửi thành công: " + info.response);
        resolve(info);
      }
    });
  });
};

/**
 * Tạo giao diện HTML Premium cho Email OTP
 * @param {string} fullName - Tên khách hàng
 * @param {string} otp - Mã OTP
 * @param {string} type - Loại giao dịch ('register' hoặc 'forgot')
 */
export const getOtpEmailTemplate = (fullName, otp, type = "register") => {
  const title = type === "register" ? "Xác nhận đăng ký tài khoản" : "Khôi phục mật khẩu";
  const actionText = type === "register" ? "để hoàn tất quá trình đăng ký tài khoản mới" : "để thiết lập lại mật khẩu mới cho tài khoản của bạn";
  const color = type === "register" ? "#4f46e5" : "#ef4444"; // Xanh Indigo cho đăng ký, Đỏ Rose cho quên mật khẩu

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f4f5f7;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #e1e4e8;
        }
        .header {
          background-color: ${color};
          padding: 30px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
          line-height: 1.6;
        }
        .content p {
          margin: 0 0 20px 0;
          font-size: 15px;
        }
        .otp-box {
          background-color: #f0f2f5;
          border: 2px dashed ${color};
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 6px;
          color: ${color};
          margin: 0;
        }
        .footer {
          background-color: #fafbfc;
          padding: 20px;
          text-align: center;
          font-size: 13px;
          color: #6a737d;
          border-top: 1px solid #e1e4e8;
        }
        .footer a {
          color: ${color};
          text-decoration: none;
        }
        .warning-text {
          font-size: 12px;
          color: #888888;
          margin-top: 20px;
          border-top: 1px solid #eeeeee;
          padding-top: 15px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title.toUpperCase()}</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${fullName || "Quý khách"}</strong>,</p>
          <p>Cảm ơn bạn đã lựa chọn sử dụng dịch vụ của <strong>TourVN</strong>. Dưới đây là mã xác thực OTP của bạn ${actionText}:</p>
          <div class="otp-box">
            <h2 class="otp-code">${otp}</h2>
          </div>
          <p>Mã OTP này có hiệu lực trong vòng <strong>3 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo mật tuyệt đối tài khoản của bạn.</p>
          <p class="warning-text">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn sẽ được bảo toàn an toàn.</p>
        </div>
        <div class="footer">
          <p>© 2026 TourVN. All rights reserved.</p>
          <p>Hỗ trợ khách hàng: <a href="mailto:support@tourvn.com">support@tourvn.com</a> | Hotline: 1900 1234</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
