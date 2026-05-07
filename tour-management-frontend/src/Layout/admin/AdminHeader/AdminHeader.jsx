import { Layout, Space, Button, Avatar, Typography, Dropdown, message } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { getUser, clearAuth } from "../../../utils/auth";
import { adminLogout } from "../../../services/api";
import "./AdminHeader.css";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

function AdminHeader() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      // Ignore lỗi nếu server không phản hồi
    }
    clearAuth();
    message.success("Đăng xuất thành công");
    navigate("/admin/login");
  };

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: user?.fullName || "Admin" },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader className="admin-header">
      <div className="admin-header-right">
        {/* Nút xem giao diện client */}
        <Link to="/" target="_blank">
          <Button
            type="text"
            icon={<HomeOutlined style={{ fontSize: 18, color: "rgba(255,255,255,0.75)" }} />}
            title="Xem giao diện"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Xem giao diện
          </Button>
        </Link>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18, color: "rgba(255,255,255,0.75)" }} />}
        />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="admin-user-info" style={{ cursor: "pointer" }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: "#00b96b" }}
              src={user?.avatar}
            />
            <Text style={{ color: "rgba(255,255,255,0.85)" }}>
              {user?.fullName || "Admin"}
            </Text>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
}

export default AdminHeader;
