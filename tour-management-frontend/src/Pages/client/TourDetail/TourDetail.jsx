import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row, Col, Spin, Button, InputNumber, Tag, Divider,
  Typography, Space, Card, Statistic, message, Breadcrumb
} from "antd";
import {
  ShoppingCartOutlined, CalendarOutlined,
  BarcodeOutlined, TeamOutlined, HomeOutlined, AppstoreOutlined,
  FireOutlined,
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
  const [quantity, setQuantity] = useState(1);
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

  // Thêm vào giỏ hàng (yêu cầu đăng nhập)
  const handleAddToCart = () => {
    if (!isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/login");
      return;
    }

    if (tourDetail && quantity > 0) {
      addToCart(tourDetail.id, quantity);
      window.dispatchEvent(new Event("cartUpdated"));
      message.success({
        content: `✅ Đã thêm "${tourDetail.title}" vào giỏ hàng!`,
        duration: 3,
      });
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  if (!tourDetail) return <div style={{ padding: 40 }}>Tour không tồn tại.</div>;

  return (
    <div>
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
            <Title level={3} style={{ margin: 0, color: "#1a1a2e" }}>
              {tourDetail.title}
            </Title>

            <Space wrap>
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

            <Space align="center" size={12}>
              <CalendarOutlined style={{ color: "#888" }} />
              <Text type="secondary">
                Lịch khởi hành: {tourDetail.timeStart
                  ? new Date(tourDetail.timeStart).toLocaleDateString("vi-VN")
                  : "Liên hệ"}
              </Text>
            </Space>

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

            <Space size={12} align="center">
              <Text strong>Số lượng:</Text>
              <InputNumber
                min={1}
                max={tourDetail.stock}
                value={quantity}
                onChange={(val) => setQuantity(val || 1)}
                style={{ width: 100 }}
                size="large"
              />
            </Space>

            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
              disabled={tourDetail.stock === 0}
              style={{ height: 48, fontSize: 16, borderRadius: 10 }}
              block
            >
              {tourDetail.stock === 0 ? "Hết chỗ" : "Thêm vào giỏ hàng"}
            </Button>
          </Space>
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
