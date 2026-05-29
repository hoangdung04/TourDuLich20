import { useState, useEffect } from "react";
import { Form, Input, Button, message, Typography, Tabs, Modal } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, SafetyOutlined } from "@ant-design/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { clientLogin, clientRegister, clientVerifyOtpRegister, clientResendOtp } from "../../../services/api";
import { saveToken, saveUser } from "../../../utils/auth";
import "./ClientAuth.css";

const { Title, Text } = Typography;

// ==========================================
// TAB 1: Form Đăng nhập
// ==========================================
function LoginForm({ setLoading, loading }) {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await clientLogin({ email: values.email, password: values.password });
      if (res.data.code === "success") {
        saveToken(res.data.token);
        saveUser(res.data.user);
        window.dispatchEvent(new Event("cartUpdated")); // 🌟 Phát sự kiện cập nhật giỏ hàng theo User mới
        message.success("Đăng nhập thành công!");
        navigate("/"); // Về trang chủ client
      } else {
        message.error(res.data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form name="client-login" onFinish={onFinish} layout="vertical" size="large">
      <Form.Item
        name="email"
        rules={[
          { required: true, message: "Vui lòng nhập email" },
          { type: "email", message: "Email không hợp lệ" },
        ]}
      >
        <Input prefix={<MailOutlined className="input-icon" />} placeholder="Email của bạn" className="client-input" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
      >
        <Input.Password prefix={<LockOutlined className="input-icon" />} placeholder="Mật khẩu" className="client-input" />
      </Form.Item>

      <div style={{ textAlign: "right", marginBottom: 20 }}>
        <Link to="/forgot-password">
          <Text type="secondary" style={{ fontSize: 14 }}>Quên mật khẩu?</Text>
        </Link>
      </div>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block className="client-auth-btn">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </Form.Item>
    </Form>
  );
}

// ==========================================
// TAB 2: Form Đăng ký
// ==========================================
function RegisterForm({ setLoading, loading }) {
  const navigate = useNavigate();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [email, setEmail] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpForm] = Form.useForm();

  // Bộ đếm ngược hết hạn OTP
  useEffect(() => {
    let timer;
    if (countdown > 0 && showOtpModal) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, showOtpModal]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await clientRegister({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
      });
      if (res.data.code === "otp_sent") {
        setEmail(values.email);
        setShowOtpModal(true);
        setCountdown(180); // Đếm ngược 180 giây (3 phút)
        message.success("Mã OTP xác thực tài khoản đã được gửi về email của bạn!");
      } else {
        message.error(res.data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValues) => {
    setOtpLoading(true);
    try {
      const res = await clientVerifyOtpRegister({
        email,
        otp: otpValues.otp
      });
      if (res.data.code === "success") {
        saveToken(res.data.token);
        saveUser(res.data.user);
        window.dispatchEvent(new Event("cartUpdated")); // Đồng bộ giỏ hàng
        message.success("Chúc mừng bạn đã đăng ký tài khoản thành công");
        setShowOtpModal(false);
        navigate("/"); // Về trang chủ client
      } else {
        message.error(res.data.message || "Xác thực mã OTP thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await clientResendOtp({ email, type: "register" });
      if (res.data.code === "otp_sent") {
        message.success("Đã gửi lại mã OTP mới!");
        setCountdown(180);
      } else {
        message.error(res.data.message || "Gửi lại OTP thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Gửi lại OTP thất bại");
    }
  };

  return (
    <>
      <Form name="client-register" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input prefix={<UserOutlined className="input-icon" />} placeholder="Họ và tên" className="client-input" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input prefix={<MailOutlined className="input-icon" />} placeholder="Email" className="client-input" />
        </Form.Item>

        <Form.Item name="phone">
          <Input prefix={<PhoneOutlined className="input-icon" />} placeholder="Số điện thoại (không bắt buộc)" className="client-input" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu" },
            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
          ]}
        >
          <Input.Password prefix={<LockOutlined className="input-icon" />} placeholder="Mật khẩu" className="client-input" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) return Promise.resolve();
                return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined className="input-icon" />} placeholder="Xác nhận mật khẩu" className="client-input" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block className="client-auth-btn">
            {loading ? "Đang xử lý..." : "Đăng ký ngay"}
          </Button>
        </Form.Item>
      </Form>

      {/* Modal xác thực OTP */}
      <Modal
        title={
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, paddingBottom: 10 }}>
            Xác thực tài khoản
          </div>
        }
        open={showOtpModal}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
        width={400}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Text type="secondary">
            Chúng tôi đã gửi một mã OTP gồm 6 chữ số tới email: <br />
            <strong>{email}</strong>. Vui lòng nhập mã để hoàn tất.
          </Text>
        </div>

        <Form form={otpForm} onFinish={handleVerifyOtp} layout="vertical" size="large">
          <Form.Item
            name="otp"
            rules={[
              { required: true, message: "Vui lòng nhập mã OTP" },
              { len: 6, message: "Mã OTP phải gồm 6 chữ số" },
            ]}
          >
            <Input
              prefix={<SafetyOutlined className="input-icon" />}
              placeholder="Mã OTP 6 chữ số"
              className="client-input"
              style={{ textAlign: "center", letterSpacing: 4, fontSize: 16 }}
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            {countdown > 0 ? (
              <Text type="secondary">Gửi lại mã sau: <strong>{countdown}s</strong></Text>
            ) : (
              <Text type="danger">Mã OTP đã hết hạn</Text>
            )}

            <Button
              type="link"
              onClick={handleResendOtp}
              disabled={countdown > 0}
              style={{ padding: 0 }}
            >
              Gửi lại mã OTP
            </Button>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={otpLoading} block className="client-auth-btn" style={{ margin: 0 }}>
              Xác nhận & Kích hoạt
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <Button type="link" onClick={() => setShowOtpModal(false)} danger size="small" style={{ padding: 0 }}>
              Hủy bỏ đăng ký
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

// ==========================================
// TRANG CHÍNH: ClientAuth (Đăng nhập / Đăng ký)
// ==========================================
function ClientAuth() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const defaultTab = location.pathname === "/register" ? "register" : "login";

  const items = [
    {
      key: "login",
      label: "Đăng nhập",
      children: <LoginForm setLoading={setLoading} loading={loading} />,
    },
    {
      key: "register",
      label: "Đăng ký",
      children: <RegisterForm setLoading={setLoading} loading={loading} />,
    },
  ];

  return (
    <div className="client-auth-page">
      {/* Hình tròn trang trí nền */}
      <div className="client-auth-circle client-auth-circle--1" />
      <div className="client-auth-circle client-auth-circle--2" />

      <div className="client-auth-card">
        {/* Logo */}
        <div className="client-auth-logo">
          <div className="client-auth-logo-icon">
            <GlobalOutlined />
          </div>
          <Title level={2} className="client-auth-title">TourVN</Title>
          <Text className="client-auth-subtitle">Khám phá Việt Nam cùng chúng tôi</Text>
        </div>

        {/* Tab Đăng nhập / Đăng ký */}
        <Tabs defaultActiveKey={defaultTab} items={items} centered size="large" className="client-auth-tabs" />

        {/* Link về trang chủ */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/">
            <Text type="secondary" style={{ fontSize: 13 }}>← Quay về trang chủ</Text>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ClientAuth;
