import { useState } from "react";
import { Form, Input, Button, message, Typography, Tabs } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined, GlobalOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { clientLogin, clientRegister } from "../../../services/api";
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

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await clientRegister({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
      });
      if (res.data.code === "success") {
        saveToken(res.data.token);
        saveUser(res.data.user);
        message.success("Đăng ký thành công! Chào mừng bạn đến với TourVN!");
        navigate("/"); // Về trang chủ client
      } else {
        message.error(res.data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          {loading ? "Đang đăng ký..." : "Đăng ký ngay"}
        </Button>
      </Form.Item>
    </Form>
  );
}

// ==========================================
// TRANG CHÍNH: ClientAuth (Đăng nhập / Đăng ký)
// ==========================================
function ClientAuth() {
  const [loading, setLoading] = useState(false);

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
        <Tabs defaultActiveKey="login" items={items} centered size="large" className="client-auth-tabs" />

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
