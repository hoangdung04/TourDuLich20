import { Layout, Menu, Typography } from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  SettingOutlined,
  GlobalOutlined,
  TagsOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined,
  ShoppingCartOutlined,
  DashboardOutlined,
  MessageOutlined,
  ReadOutlined,
  FileTextOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import "./AdminSider.css";

const { Sider } = Layout;
const { Text } = Typography;

function AdminSider() {
  const location = useLocation();

  const getSelectedKey = () => {
    if (location.pathname.startsWith("/admin/dashboard")) return "dashboard";
    if (location.pathname.startsWith("/admin/tours/create")) return "tours-create";
    if (location.pathname.startsWith("/admin/tours")) return "tours";
    if (location.pathname.startsWith("/admin/orders")) return "orders";
    if (location.pathname.startsWith("/admin/categories")) return "categories";
    if (location.pathname.startsWith("/admin/roles/permissions")) return "roles-permissions";
    if (location.pathname.startsWith("/admin/roles")) return "roles";
    if (location.pathname.startsWith("/admin/accounts")) return "accounts";
    if (location.pathname.startsWith("/admin/chat")) return "chat";
    if (location.pathname.startsWith("/admin/articles/create")) return "articles-create";
    if (location.pathname.startsWith("/admin/articles")) return "articles";
    return "tours";
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Tổng quan</Link>,
    },
    {
      key: "tour-group",
      icon: <GlobalOutlined />,
      label: "Quản lý Tour",
      children: [
        {
          key: "tours",
          icon: <UnorderedListOutlined />,
          label: <Link to="/admin/tours">Danh sách tour</Link>,
        },
        {
          key: "tours-create",
          icon: <AppstoreOutlined />,
          label: <Link to="/admin/tours/create">Thêm tour mới</Link>,
        },
      ],
    },
    {
      key: "orders-group",
      icon: <ShoppingCartOutlined />,
      label: "Đơn hàng",
      children: [
        {
          key: "orders",
          icon: <UnorderedListOutlined />,
          label: <Link to="/admin/orders">Danh sách đơn hàng</Link>,
        },
      ],
    },
    {
      key: "category-group",
      icon: <TagsOutlined />,
      label: "Danh mục",
      children: [
        {
          key: "categories",
          icon: <TagsOutlined />,
          label: <Link to="/admin/categories">Danh sách danh mục</Link>,
        },
      ],
    },
    {
      key: "chat",
      icon: <MessageOutlined />,
      label: <Link to="/admin/chat">Chat Hỗ trợ</Link>,
    },
    {
      key: "article-group",
      icon: <ReadOutlined />,
      label: "Bài viết",
      children: [
        {
          key: "articles",
          icon: <FileTextOutlined />,
          label: <Link to="/admin/articles">Danh sách bài viết</Link>,
        },
        {
          key: "articles-create",
          icon: <PlusOutlined />,
          label: <Link to="/admin/articles/create">Thêm bài viết</Link>,
        },
      ],
    },
    {
      type: "divider",
    },
    {
      key: "system-group",
      icon: <SettingOutlined />,
      label: "Hệ thống",
      children: [
        {
          key: "accounts",
          icon: <TeamOutlined />,
          label: <Link to="/admin/accounts">Tài khoản</Link>,
        },
        {
          key: "roles",
          icon: <UserSwitchOutlined />,
          label: <Link to="/admin/roles">Vai trò</Link>,
        },
        {
          key: "roles-permissions",
          icon: <SafetyCertificateOutlined />,
          label: <Link to="/admin/roles/permissions">Phân quyền</Link>,
        },
      ],
    },
  ];

  return (
    <Sider width={240} className="admin-sider" theme="dark">
      {/* Logo area */}
      <div className="sider-logo">
        <GlobalOutlined className="sider-logo-icon" />
        <Text strong className="sider-logo-text">TourVN Admin</Text>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={["tour-group", "orders-group", "category-group", "article-group", "system-group"]}
        items={menuItems}
        className="admin-menu"
      />
    </Sider>
  );
}

export default AdminSider;
