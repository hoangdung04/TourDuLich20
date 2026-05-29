import { useState } from "react";
import { Form, Input, Button, message, Typography, Card, Alert } from "antd";
import { LockOutlined, KeyOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { clientChangePassword } from "../../../services/api";
import { isLoggedIn } from "../../../utils/auth";

const { Title, Text } = Typography;

function ChangePassword() {
  const [form]           = Form.useForm();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const navigate                = useNavigate();

  // Chưa đăng nhập → redirect
  if (!isLoggedIn()) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <Alert
          message="Bạn chưa đăng nhập"
          description={<>Vui lòng <Link to="/login">đăng nhập</Link> để đổi mật khẩu.</>}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await clientChangePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (res.data.code === "success") {
        setSuccess(true);
        form.resetFields();
        message.success("Đổi mật khẩu thành công!");
      } else {
        message.error(res.data.message || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "48px auto", padding: "0 16px" }}>
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #00b96b, #009654)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <KeyOutlined style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>Đổi Mật Khẩu</Title>
          <Text type="secondary">Nhập mật khẩu cũ và mật khẩu mới để cập nhật</Text>
        </div>

        {/* Success state */}
        {success && (
          <Alert
            icon={<CheckCircleOutlined />}
            message="Đổi mật khẩu thành công!"
            description="Mật khẩu của bạn đã được cập nhật. Vui lòng sử dụng mật khẩu mới khi đăng nhập lần sau."
            type="success"
            showIcon
            style={{ marginBottom: 24, borderRadius: 10 }}
            action={
              <Button size="small" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
            }
          />
        )}

        {/* Form */}
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="oldPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bbb" }} />}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bbb" }} />}
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bbb" }} />}
              placeholder="Nhập lại mật khẩu mới"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 46, borderRadius: 10, fontWeight: 600 }}
            >
              {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <Link to="/">
              <Text type="secondary" style={{ fontSize: 13 }}>
                ← Quay về trang chủ
              </Text>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default ChangePassword;
