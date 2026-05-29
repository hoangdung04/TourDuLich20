import { Layout, Row, Col, Typography } from "antd";
import {
  GlobalOutlined, EnvironmentOutlined, PhoneOutlined,
  MailOutlined, FacebookOutlined, InstagramOutlined, YoutubeOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./Footer.css";

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

function Footer() {
  return (
    <AntFooter className="client-footer">
      <div className="footer-inner">
        <Row gutter={[40, 32]}>
          {/* Brand */}
          <Col xs={24} sm={12} md={7}>
            <div className="footer-brand">
              <GlobalOutlined className="footer-logo-icon" />
              <span className="footer-logo-text">TourVN</span>
            </div>
            <Text className="footer-brand-desc">
              Hành trình tuyệt vời bắt đầu từ đây — khám phá Việt Nam cùng chúng tôi với hơn 500 tour du lịch chất lượng cao.
            </Text>
            <div className="footer-social">
              <a href="#" className="footer-social-icon"><FacebookOutlined /></a>
              <a href="#" className="footer-social-icon"><InstagramOutlined /></a>
              <a href="#" className="footer-social-icon"><YoutubeOutlined /></a>
            </div>
          </Col>

          {/* Quick links */}
          <Col xs={12} sm={6} md={5}>
            <Title level={5} className="footer-heading">Khám phá</Title>
            <ul className="footer-links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/categories">Danh mục tour</Link></li>
              <li><Link to="/order/history">Đơn hàng của tôi</Link></li>
              <li><Link to="/cart">Đặt chỗ</Link></li>
            </ul>
          </Col>

          {/* Support */}
          <Col xs={12} sm={6} md={5}>
            <Title level={5} className="footer-heading">Hỗ trợ</Title>
            <ul className="footer-links">
              <li><a href="#">Hướng dẫn đặt tour</a></li>
              <li><a href="#">Chính sách hoàn tiền</a></li>
              <li><a href="#">Điều khoản dịch vụ</a></li>
              <li><Link to="/change-password">Đổi mật khẩu</Link></li>
            </ul>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={12} md={7}>
            <Title level={5} className="footer-heading">Liên hệ</Title>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <EnvironmentOutlined />
                <span>123 Đường Du Lịch, Q.1, TP.HCM</span>
              </div>
              <div className="footer-contact-item">
                <PhoneOutlined />
                <span>1800 1234 (Miễn phí)</span>
              </div>
              <div className="footer-contact-item">
                <MailOutlined />
                <span>support@tourvn.vn</span>
              </div>
            </div>
          </Col>
        </Row>

        <div className="footer-bottom">
          <Text className="footer-copy">
            © {new Date().getFullYear()} <strong>TourVN</strong> — Khám phá Việt Nam cùng chúng tôi. All rights reserved.
          </Text>
        </div>
      </div>
    </AntFooter>
  );
}

export default Footer;
