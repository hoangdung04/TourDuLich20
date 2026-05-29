import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row, Col, Spin, Button, InputNumber, Tag, Divider,
  Typography, Space, Card, Statistic, message, Breadcrumb
} from "antd";
import {
  ShoppingCartOutlined, CalendarOutlined,
  BarcodeOutlined, TeamOutlined, HomeOutlined, AppstoreOutlined,
  FireOutlined, EnvironmentOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { getTourDetail } from "../../../services/api";
import { addToCart } from "../../../utils/cart";
import { isLoggedIn } from "../../../utils/auth";
import "./TourDetail.css";

const { Title, Text, Paragraph } = Typography;

function TourDetail() {
  const { slugTour } = useParams();
  const [tourDetail, setTourDetail] = useState(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [toddlers, setToddlers] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [visa, setVisa] = useState(0);
  const [singleRoom, setSingleRoom] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTourDetail = async () => {
      try {
        const response = await getTourDetail(slugTour);
        console.log(response);
        setTourDetail(response.data.tourDetail);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết tour:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTourDetail();
  }, [slugTour]);

  const priceSpecial = tourDetail ? tourDetail.price_special : 0;
  const adultsPrice = priceSpecial * adults;
  const childrenPrice = Math.round(priceSpecial * 0.7) * children; // Giảm 30% giá
  const toddlersPrice = Math.round(priceSpecial * 0.5) * toddlers;
  const seniorsPrice = Math.round(priceSpecial * 0.6) * seniors; // Người cao tuổi giảm 40% (tính 60%)
  const visaPrice = 1500000 * visa;
  const singleRoomPrice = 3500000 * singleRoom;
  const totalPrice = adultsPrice + childrenPrice + toddlersPrice + seniorsPrice + visaPrice + singleRoomPrice;

  // Thêm vào giỏ hàng (yêu cầu đăng nhập)
  const handleAddToCart = () => {
    if (!isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để chọn đặt tour");
      navigate("/login");
      return;
    }

    if (tourDetail && (adults + children + toddlers + seniors) > 0) {
      addToCart(tourDetail.id, {
        adultsQuantity: adults,
        childrenQuantity: children,
        toddlersQuantity: toddlers,
        infantsQuantity: 0,
        seniorsQuantity: seniors,
        visaQuantity: visa,
        singleRoomQuantity: singleRoom,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      message.success({
        content: `✅ Đã chọn đặt tour "${tourDetail.title}" thành công!`,
        duration: 3,
      });
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  if (!tourDetail) return <div style={{ padding: 40 }}>Tour không tồn tại.</div>;

  return (
    <div className="tour-detail-page">
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: <Link to="/categories"><AppstoreOutlined /> Danh mục</Link> },
          { title: tourDetail.title },
        ]}
      />

      <Row gutter={[32, 32]}>
        {/* Left: Image gallery */}
        <Col xs={24} md={12}>
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            loop
            className="swiper-images-main"
          >
            {tourDetail.images?.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="inner-image">
                  <img src={image} alt={`${tourDetail.title} - ${index + 1}`} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </Col>

        {/* Right: Tour info */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Title level={3} className="tour-detail-title">
              {tourDetail.title}
            </Title>

            <Space wrap className="tour-detail-tags">
              <Tag icon={<BarcodeOutlined />} color="default">
                Mã tour: {tourDetail.code}
              </Tag>
              {tourDetail.discount > 0 && (
                <Tag icon={<FireOutlined />} color="red">
                  Giảm {tourDetail.discount}%
                </Tag>
              )}
              <Tag icon={<TeamOutlined />} color={tourDetail.stock > 0 ? "green" : "red"}>
                Còn {tourDetail.stock} chỗ
              </Tag>
            </Space>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Space align="center" size={8} style={{ background: 'rgba(0,185,107,0.06)', padding: '6px 14px', borderRadius: 10 }}>
                <CalendarOutlined style={{ color: 'var(--primary)', fontSize: 15 }} />
                <Text style={{ fontSize: 13, color: '#374151' }}>
                  Khởi hành: <strong>{tourDetail.timeStart
                    ? new Date(tourDetail.timeStart).toLocaleDateString("vi-VN")
                    : "Liên hệ"}</strong>
                </Text>
              </Space>
              {tourDetail.destination && (
                <Space align="center" size={8} style={{ background: 'rgba(255,107,53,0.06)', padding: '6px 14px', borderRadius: 10 }}>
                  <EnvironmentOutlined style={{ color: 'var(--accent)', fontSize: 15 }} />
                  <Text style={{ fontSize: 13, color: '#374151' }}>
                    Điểm đến: <strong>{tourDetail.destination}</strong>
                  </Text>
                </Space>
              )}
            </div>

            <Card className="price-card" bordered={false}>
              <Row gutter={24}>
                <Col>
                  <Statistic
                    title="Giá đặc biệt"
                    value={tourDetail.price_special}
                    suffix="đ"
                    valueStyle={{ color: "#00b96b", fontWeight: 700, fontSize: 28 }}
                    formatter={(v) => v?.toLocaleString("vi-VN")}
                  />
                </Col>
                <Col>
                  <Text type="secondary" style={{ fontSize: 13 }}>Giá gốc</Text>
                  <br />
                  <Text delete type="secondary" style={{ fontSize: 18 }}>
                    {tourDetail.price?.toLocaleString("vi-VN")}đ
                  </Text>
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>

        {/* Cột full-width cho phần chọn hành khách và tổng tiền */}
        <Col span={24}>
          <Card title={<span style={{ fontWeight: 700 }}><TeamOutlined /> Chọn hành khách & Dịch vụ</span>} size="small" className="traveler-selector-card">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div className="traveler-row">
                  <div className="traveler-label">
                    <Text strong style={{ fontSize: 14, color: "#1f2937" }}>Người lớn</Text>
                    <span className="traveler-desc">Từ 11 đến dưới 60 tuổi (100% giá)</span>
                    <span className="traveler-price-tag">{priceSpecial.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <InputNumber
                    min={1}
                    value={adults}
                    onChange={(val) => {
                      const nextVal = val || 1;
                      if (nextVal + children + toddlers + seniors <= tourDetail.stock) {
                        setAdults(nextVal);
                      } else {
                        message.warning(`Tổng số chỗ vượt quá số lượng còn lại của Tour (${tourDetail.stock} chỗ)`);
                      }
                    }}
                    size="middle"
                  />
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="traveler-row">
                  <div className="traveler-label">
                    <Text strong style={{ fontSize: 14, color: "#1f2937" }}>Người cao tuổi</Text>
                    <span className="traveler-desc">Từ 60 tuổi trở lên (Giảm 40% giá)</span>
                    <span className="traveler-price-tag">{Math.round(priceSpecial * 0.6).toLocaleString("vi-VN")}đ</span>
                  </div>
                  <InputNumber
                    min={0}
                    value={seniors}
                    onChange={(val) => {
                      const nextVal = val || 0;
                      if (adults + children + toddlers + nextVal <= tourDetail.stock) {
                        setSeniors(nextVal);
                      } else {
                        message.warning(`Tổng số chỗ vượt quá số lượng còn lại của Tour (${tourDetail.stock} chỗ)`);
                      }
                    }}
                    size="middle"
                  />
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="traveler-row">
                  <div className="traveler-label">
                    <Text strong style={{ fontSize: 14, color: "#1f2937" }}>Trẻ em</Text>
                    <span className="traveler-desc">Từ 5 đến dưới 11 tuổi (Giảm 30% giá)</span>
                    <span className="traveler-price-tag">{Math.round(priceSpecial * 0.7).toLocaleString("vi-VN")}đ</span>
                  </div>
                  <InputNumber
                    min={0}
                    value={children}
                    onChange={(val) => {
                      const nextVal = val || 0;
                      if (adults + nextVal + toddlers + seniors <= tourDetail.stock) {
                        setChildren(nextVal);
                      } else {
                        message.warning(`Tổng số chỗ vượt quá số lượng còn lại của Tour (${tourDetail.stock} chỗ)`);
                      }
                    }}
                    size="middle"
                  />
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="traveler-row">
                  <div className="traveler-label">
                    <Text strong style={{ fontSize: 14, color: "#1f2937" }}>Trẻ nhỏ</Text>
                    <span className="traveler-desc">Từ 2 đến dưới 5 tuổi (Giảm 50% giá)</span>
                    <span className="traveler-price-tag">{Math.round(priceSpecial * 0.5).toLocaleString("vi-VN")}đ</span>
                  </div>
                  <InputNumber
                    min={0}
                    value={toddlers}
                    onChange={(val) => {
                      const nextVal = val || 0;
                      if (adults + children + nextVal + seniors <= tourDetail.stock) {
                        setToddlers(nextVal);
                      } else {
                        message.warning(`Tổng số chỗ vượt quá số lượng còn lại của Tour (${tourDetail.stock} chỗ)`);
                      }
                    }}
                    size="middle"
                  />
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="traveler-row">
                  <div className="traveler-label">
                    <Text strong style={{ fontSize: 14, color: "#1f2937" }}>Phụ thu Visa</Text>
                    <span className="traveler-desc">Hỗ trợ làm visa nhanh</span>
                    <span className="traveler-price-tag" style={{ color: "#b45309", background: "#fef3c7" }}>1,500,000đ / khách</span>
                  </div>
                  <InputNumber
                    min={0}
                    max={adults + children + toddlers + seniors}
                    value={visa}
                    onChange={(val) => setVisa(val || 0)}
                    size="middle"
                  />
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="traveler-row">
                  <div className="traveler-label">
                    <Text strong style={{ fontSize: 14, color: "#1f2937" }}>Phòng đơn</Text>
                    <span className="traveler-desc">Phụ thu nếu muốn ở phòng riêng</span>
                    <span className="traveler-price-tag" style={{ color: "#b45309", background: "#fef3c7" }}>3,500,000đ / phòng</span>
                  </div>
                  <InputNumber
                    min={0}
                    value={singleRoom}
                    onChange={(val) => setSingleRoom(val || 0)}
                    size="middle"
                  />
                </div>
              </Col>
            </Row>
          </Card>

          <div className="total-preview-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <div className="total-label">Tổng tiền tạm tính</div>
                <div className="total-price">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                disabled={tourDetail.stock === 0 || (adults + children + toddlers + seniors) === 0}
                className="btn-add-cart"
              >
                {tourDetail.stock === 0 ? "Hết chỗ" : "Chọn đặt Tour này"}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Divider />

      {/* Tour information */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card
            title={<Title level={4} style={{ margin: 0, color: "#00b96b" }}>📋 Thông tin tour</Title>}
            bordered={false}
            className="info-card"
          >
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: tourDetail.information }}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title={<Title level={4} style={{ margin: 0, color: "#00b96b" }}>🗺️ Lịch trình tour</Title>}
            bordered={false}
            className="info-card"
          >
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: tourDetail.schedule }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TourDetail;
