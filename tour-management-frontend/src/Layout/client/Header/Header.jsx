import { Layout, Menu, Badge, Typography, Button, Space, Avatar, Dropdown } from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  GlobalOutlined,
  LoginOutlined,
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCartCount } from "../../../utils/cart";
import { isLoggedIn, getUser, clearAuth, isAdmin } from "../../../utils/auth";
import { clientLogout } from "../../../services/api";
import { useState, useEffect } from "react";
import "./Header.css";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

function Header() {
  const [cartCount, setCartCount] = useState(getCartCount());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const update = () => setCartCount(getCartCount());
    window.addEventListener("storage", update);
    window.addEventListener("cartUpdated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cartUpdated", update);
    };
  }, []);

  // Xác định menu item active dựa theo path hiện tại
  const selectedKey = () => {
    if (location.pathname.startsWith("/tours")) return "tours";
    if (location.pathname === "/cart") return "cart";
    return "home";
  };

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: "tours",
      icon: <AppstoreOutlined />,
      label: <Link to="/categories">Danh mục</Link>,
    },
    {
      key: "cart",
      icon: (
        <Badge count={cartCount} size="small" offset={[4, -2]}>
          <ShoppingCartOutlined style={{ fontSize: 16, color: "#fff" }} />
        </Badge>
      ),
      label: <Link to="/cart">Giỏ hàng</Link>,
    },
  ];

  const loggedIn = isLoggedIn();
  const user = getUser();
  const admin = isAdmin(); // Kiểm tra có phải quản trị viên không

  const handleLogout = async () => {
    try { await clientLogout(); } catch { /* bỏ qua lỗi */ }
    clearAuth();
    window.location.href = "/";
  };

  // Menu dropdown: Chỉ hiện nút "Trang quản trị" nếu là Admin
  const userMenuItems = [
    // Chỉ thêm mục này nếu user là quản trị viên
    ...(admin ? [{
      key: "admin",
      icon: <DashboardOutlined />,
      label: <Link to="/admin">Trang quản trị</Link>,
    }, { type: "divider" }] : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader className="client-header">
      {/* Logo */}
      <div className="header-logo" onClick={() => navigate("/")}>
        <GlobalOutlined className="logo-icon" />
        <Text strong className="logo-text">TourVN</Text>
      </div>

      {/* Navigation menu */}
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[selectedKey()]}
        items={menuItems}
        className="header-menu"
        disabledOverflow
      />

      {/* Auth area */}
      <div className="header-auth">
        {loggedIn ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="header-user" style={{ cursor: "pointer" }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: "#00b96b" }}
              />
              <Text className="header-username">{user?.fullName || "Admin"}</Text>
            </Space>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            ghost
            icon={<LoginOutlined />}
            className="header-login-btn"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </AntHeader>
  );
}

export default Header;
