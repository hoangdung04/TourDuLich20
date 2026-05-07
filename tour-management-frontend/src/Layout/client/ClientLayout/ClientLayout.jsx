import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./ClientLayout.css";

const { Content } = Layout;

function ClientLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header />
      <Content className="client-content">
        <div className="client-content-inner">
          <Outlet />
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default ClientLayout;
