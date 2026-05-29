import { useState, useEffect } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { MailOutlined, LockOutlined, SafetyOutlined, GlobalOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { clientForgotPassword, clientResetPassword, clientResendOtp } from "../../../services/api";
import "./ForgotPassword.css";

const { Title, Text } = Typography;

function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Nhập email, 1: Nhập OTP & Mật khẩu mới
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Bộ đếm ngược gửi lại OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Bước 1: Yêu cầu mã OTP
  const handleRequestOtp = async (values) => {
    setLoading(true);
    try {
      const res = await clientForgotPassword({ email: values.email });
      if (res.data.code === "otp_sent") {
        message.success(res.data.message || "Mã OTP đã được gửi!");
        setEmail(values.email);
        setStep(1);
        setCountdown(60); // Đếm ngược 60 giây để gửi lại
      } else {
        message.error(res.data.message || "Gửi OTP thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Email không tồn tại hoặc lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác nhận OTP và đặt mật khẩu mới
  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      const res = await clientResetPassword({
        email,
        otp: values.otp,
        password: values.password,
      });
      if (res.data.code === "success") {
        message.success("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
        navigate("/login");
      } else {
        message.error(res.data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    try {
      const res = await clientResendOtp({ email, type: "forgot" });
      if (res.data.code === "otp_sent") {
        message.success("Đã gửi lại mã OTP mới!");
        setCountdown(60);
      } else {
        message.error(res.data.message || "Gửi lại OTP thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Gửi lại OTP thất bại");
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-circle forgot-password-circle--1" />
      <div className="forgot-password-circle forgot-password-circle--2" />

      <div className="forgot-password-card">
        <div className="forgot-password-logo">
          <div className="forgot-password-logo-icon">
            <GlobalOutlined />
          </div>
          <Title level={2} className="forgot-password-title">TourVN</Title>
          <Text className="forgot-password-subtitle">
            {step === 0 ? "Khôi phục mật khẩu tài khoản" : "Nhập mã OTP & mật khẩu mới"}
          </Text>
        </div>

        {step === 0 ? (
          <Form onFinish={handleRequestOtp} layout="vertical" size="large" className="forgot-form">
            <Text type="secondary" className="step-desc">
              Vui lòng nhập email đăng ký tài khoản của bạn. Hệ thống sẽ gửi một mã OTP gồm 6 chữ số để xác thực.
            </Text>
            
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
              style={{ marginTop: 20 }}
            >
              <Input prefix={<MailOutlined className="input-icon" />} placeholder="Nhập email của bạn" className="client-input" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block className="client-auth-btn">
                Gửi mã xác thực OTP
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form onFinish={handleResetPassword} layout="vertical" size="large" className="forgot-form">
            <Text type="secondary" className="step-desc">
              Mã OTP đã được gửi tới email <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
            </Text>

            <Form.Item
              name="otp"
              rules={[
                { required: true, message: "Vui lòng nhập mã OTP" },
                { len: 6, message: "Mã OTP gồm 6 chữ số" },
              ]}
              style={{ marginTop: 20 }}
            >
              <Input prefix={<SafetyOutlined className="input-icon" />} placeholder="Nhập mã OTP (6 chữ số)" className="client-input" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu mới tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password prefix={<LockOutlined className="input-icon" />} placeholder="Mật khẩu mới" className="client-input" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) return Promise.resolve();
                    return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined className="input-icon" />} placeholder="Xác nhận mật khẩu mới" className="client-input" />
            </Form.Item>

            <div className="resend-container">
              {countdown > 0 ? (
                <Text type="secondary">Gửi lại mã sau <strong>{countdown}s</strong></Text>
              ) : (
                <Button type="link" onClick={handleResendOtp} className="resend-btn" style={{ padding: 0 }}>
                  Gửi lại mã OTP
                </Button>
              )}
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block className="client-auth-btn">
                Xác nhận thay đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        )}

        <div className="back-to-login">
          <Link to="/login">
            <Text type="secondary" style={{ fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <ArrowLeftOutlined /> Quay lại đăng nhập
            </Text>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
