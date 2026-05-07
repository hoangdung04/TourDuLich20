import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import AdminHeader from "../AdminHeader/AdminHeader";
import AdminSider from "../AdminSider/AdminSider";
import "./AdminLayout.css";

const { Content } = Layout;

function AdminLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSider />
      <Layout>
        <AdminHeader />
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
