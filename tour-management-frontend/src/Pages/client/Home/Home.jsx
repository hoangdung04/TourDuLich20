import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Typography, Button, Spin, Divider, Empty } from "antd";
import {
  CompassOutlined, SafetyCertificateOutlined,
  CustomerServiceOutlined, StarOutlined, RightOutlined,
  EnvironmentOutlined, TeamOutlined, CalendarOutlined,
  ThunderboltOutlined, FireOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import { getCategories, getFeaturedTours, getToursByCategories } from "../../../services/api";
import CategoryCard from "../../../components/CategoryCard";
import TourCard from "../../../components/TourCard";
import "./Home.css";

const { Title, Text, Paragraph } = Typography;

const FEATURES = [
  {
    icon: <CompassOutlined />,
    color: "#00b96b",
    bg: "#e6f9f1",
    title: "Khám phá đa dạng",
    desc: "Hàng trăm tour du lịch trong và ngoài nước được cập nhật liên tục.",
  },
  {
    icon: <SafetyCertificateOutlined />,
    color: "#faad14",
    bg: "#fffbe6",
    title: "Uy tín — An toàn",
    desc: "Cam kết chất lượng dịch vụ, đảm bảo an toàn cho mọi hành trình.",
  },
  {
    icon: <CustomerServiceOutlined />,
    color: "#1677ff",
    bg: "#e6f4ff",
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ tư vấn luôn sẵn sàng hỗ trợ bạn bất kỳ lúc nào.",
  },
  {
    icon: <StarOutlined />,
    color: "#f5222d",
    bg: "#fff1f0",
    title: "Giá tốt nhất",
    desc: "Cam kết giá cả cạnh tranh, nhiều ưu đãi hấp dẫn cho khách hàng.",
  },
];

function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState({ bestDeals: [], newest: [] });
  const [catTours, setCatTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCategories().then(r => setCategories(r.data.categories || [])),
      getFeaturedTours().then(r => setFeatured(r.data)),
      getToursByCategories().then(r => setCatTours(r.data.categories || [])),
    ])
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="home-hero">
        <div className="hero-bg-shape hero-bg-shape--1" />
        <div className="hero-bg-shape hero-bg-shape--2" />
        <div className="hero-bg-shape hero-bg-shape--3" />

        <div className="hero-container">
          <div className="hero-text">
            <div className="hero-badge">
              <ThunderboltOutlined /> Đặt tour online — giảm ngay 10%
            </div>

            <h1 className="hero-title">
              Khám Phá
              <span className="hero-title-accent"> Việt Nam </span>
              Theo Cách Của Bạn
            </h1>

            <p className="hero-desc">
              Trải nghiệm hơn 500+ tour du lịch chất lượng cao, từ biển xanh Phú Quốc
              đến ruộng bậc thang Sapa — đặt ngay, nhận ưu đãi tốt nhất!
            </p>

            <div className="hero-actions">
              <Link to="/categories">
                <Button type="primary" size="large" icon={<CompassOutlined />} className="hero-btn-primary">
                  Khám phá ngay
                </Button>
              </Link>
              <Link to="/order/history">
                <Button size="large" className="hero-btn-outline">
                  Đơn hàng của tôi
                </Button>
              </Link>
            </div>

            <div className="hero-trust">
              <div className="hero-trust-avatars">
                <div className="hero-avatar" style={{ background: "#00b96b" }}>H</div>
                <div className="hero-avatar" style={{ background: "#1677ff" }}>M</div>
                <div className="hero-avatar" style={{ background: "#faad14" }}>T</div>
                <div className="hero-avatar" style={{ background: "#f5222d" }}>A</div>
                <div className="hero-avatar hero-avatar--more">+</div>
              </div>
              <div className="hero-trust-text">
                <strong>10,000+</strong> khách hàng tin tưởng
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-grid">
              <div className="hero-float-card hero-float-card--main">
                <div className="hfc-icon-wrap" style={{ background: "#e6f9f1" }}>
                  <EnvironmentOutlined style={{ fontSize: 28, color: "#00b96b" }} />
                </div>
                <div className="hfc-number">50+</div>
                <div className="hfc-label">Điểm đến</div>
                <div className="hfc-sub">Trong và ngoài nước</div>
              </div>

              <div className="hero-float-card hero-float-card--tr">
                <div className="hfc-icon-wrap" style={{ background: "#fff3ee" }}>
                  <CalendarOutlined style={{ fontSize: 22, color: "#ff6b35" }} />
                </div>
                <div className="hfc-number">500+</div>
                <div className="hfc-label">Tour mỗi năm</div>
              </div>

              <div className="hero-float-card hero-float-card--br">
                <div className="hfc-icon-wrap" style={{ background: "#e6f4ff" }}>
                  <TeamOutlined style={{ fontSize: 22, color: "#1677ff" }} />
                </div>
                <div className="hfc-number">4.9 ★</div>
                <div className="hfc-label">Đánh giá trung bình</div>
              </div>

              <div className="hero-float-badge">
                🏆 Top #1 Du lịch Việt Nam
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ BEST DEALS ══════════════════ */}
      {featured.bestDeals?.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-label section-label--fire">
              <FireOutlined /> ƯU ĐÃI TỐT NHẤT
            </div>
            <Title level={2} className="section-title">
              Tour Giảm Giá Hấp Dẫn
            </Title>
            <Text className="section-sub">
              Đặt ngay để nhận mức giá ưu đãi nhất — số lượng có hạn!
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {featured.bestDeals.slice(0, 4).map(item => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <TourCard item={item} />
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* ══════════════════ NEWEST TOURS ══════════════════ */}
      {featured.newest?.length > 0 && (
        <section className="home-section home-section--alt">
          <div className="section-header">
            <div className="section-label section-label--blue">
              <ClockCircleOutlined /> MỚI CẬP NHẬT
            </div>
            <Title level={2} className="section-title">
              Tour Mới Nhất
            </Title>
            <Text className="section-sub">
              Những tour mới nhất vừa được cập nhật — khám phá ngay!
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {featured.newest.slice(0, 4).map(item => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <TourCard item={item} />
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* ══════════════════ TOURS BY CATEGORY ══════════════════ */}
      {catTours.filter(c => c.tours?.length > 0).map(cat => (
        <section key={cat.id} className="home-section home-cat-section">
          <div className="section-header section-header--left">
            <div className="cat-section-top">
              <div>
                <Title level={3} className="cat-section-title">
                  {cat.title}
                </Title>
                <Text className="section-sub">
                  Những tour được yêu thích nhất trong danh mục
                </Text>
              </div>
              <Link to={`/tours/${cat.slug}`}>
                <Button type="default" icon={<RightOutlined />} className="btn-more">
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            {cat.tours.map(item => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <TourCard item={item} />
              </Col>
            ))}
          </Row>

          <Divider style={{ margin: "40px 0 0" }} />
        </section>
      ))}

      {/* ══════════════════ CATEGORIES ══════════════════ */}
      <section className="home-section">
        <div className="section-header">
          <div className="section-label">
            <CompassOutlined /> DANH MỤC TOUR
          </div>
          <Title level={2} className="section-title">
            Điểm Đến Nổi Bật
          </Title>
          <Text className="section-sub">
            Chọn điểm đến mơ ước và bắt đầu hành trình ngay hôm nay
          </Text>
        </div>

        <Spin spinning={loading}>
          <Row gutter={[24, 24]}>
            {categories.slice(0, 8).map(item => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <CategoryCard item={item} />
              </Col>
            ))}
          </Row>
        </Spin>

        {categories.length > 8 && (
          <div className="section-more">
            <Link to="/categories">
              <Button type="default" size="large" icon={<RightOutlined />} className="btn-more">
                Xem tất cả ({categories.length})
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ══════════════════ WHY US ══════════════════ */}
      <section className="home-section home-section--alt">
        <div className="section-header">
          <div className="section-label section-label--alt">
            <StarOutlined /> TẠI SAO CHỌN CHÚNG TÔI
          </div>
          <Title level={2} className="section-title">
            Trải Nghiệm Đẳng Cấp
          </Title>
          <Text className="section-sub">
            Chúng tôi cam kết mang đến dịch vụ tốt nhất cho mọi hành trình
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {FEATURES.map((f, i) => (
            <Col key={i} xs={24} sm={12} md={6}>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h4 className="feature-title">{f.title}</h4>
                <p className="feature-desc">{f.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="home-cta">
        <div className="cta-bg-circle cta-bg-circle--1" />
        <div className="cta-bg-circle cta-bg-circle--2" />

        <div className="cta-content">
          <div className="cta-stats-row">
            {[
              { val: "500+", label: "Tour du lịch" },
              { val: "50+", label: "Điểm đến" },
              { val: "10K+", label: "Khách hàng" },
              { val: "4.9★", label: "Đánh giá" },
            ].map((s, i) => (
              <div key={i} className="cta-stat">
                <div className="cta-stat-val">{s.val}</div>
                <div className="cta-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <Title level={2} className="cta-title">
            Sẵn Sàng Cho Chuyến Đi Tiếp Theo?
          </Title>
          <Paragraph className="cta-desc">
            Đặt tour ngay hôm nay và nhận ưu đãi lên đến 30% — hành trình tuyệt vời đang chờ bạn!
          </Paragraph>
          <Link to="/categories">
            <Button type="primary" size="large" icon={<CompassOutlined />} className="cta-btn">
              Đặt Tour Ngay
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}

export default Home;
