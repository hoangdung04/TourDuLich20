import { useState } from "react";
import { Form, Input, Button, message, Typography, Checkbox } from "antd";
import { UserOutlined, LockOutlined, GlobalOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../../services/api";
import { saveToken, saveUser } from "../../../utils/auth";
import "./AdminLogin.css";

const { Title, Text } = Typography;

function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await adminLogin({ email: values.email, password: values.password });
      if (res.data.code === "success") {
        saveToken(res.data.token);
        saveUser(res.data.user);
        message.success("Đăng nhập thành công!");
        navigate("/admin/tours");
      } else {
        message.error(res.data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Email hoặc mật khẩu không đúng";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background decorations */}
      <div className="login-bg-circle login-bg-circle--1" />
      <div className="login-bg-circle login-bg-circle--2" />
      <div className="login-bg-circle login-bg-circle--3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <GlobalOutlined />
          </div>
          <Title level={2} className="login-title">TourVN Admin</Title>
          <Text className="login-subtitle">Đăng nhập vào hệ thống quản trị</Text>
        </div>

        {/* Form */}
        <Form
          name="admin-login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="login-form"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<UserOutlined className="input-icon" />}
              placeholder="Email đăng nhập"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder="Mật khẩu"
              className="login-input"
            />
          </Form.Item>

          <div className="login-options">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <Text className="login-forgot">Quên mật khẩu?</Text>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-btn"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </Form.Item>
        </Form>

        <Text className="login-footer">
          © 2025 TourVN Management System
        </Text>
      </div>
    </div>
  );
}

export default AdminLogin;
