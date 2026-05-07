import { Layout } from "antd";
import "./Footer.css";

const { Footer: AntFooter } = Layout;

function Footer() {
  return (
    <AntFooter className="client-footer">
      © 2024 TourVN — Khám phá Việt Nam cùng chúng tôi
    </AntFooter>
  );
}

export default Footer;
