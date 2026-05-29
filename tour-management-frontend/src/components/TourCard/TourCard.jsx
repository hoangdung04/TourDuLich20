import { Tag, Button, Typography } from "antd";
import { FireOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./TourCard.css";

const { Title } = Typography;

function TourCard({ item }) {
  const navigate = useNavigate();

  return (
    <div
      className="tour-card"
      onClick={() => navigate(`/tours/detail/${item.slug}`)}
    >
      {/* Image */}
      <div className="tour-card-img-wrapper">
        <img
          src={item.image || "https://placehold.co/400x210?text=Tour"}
          alt={item.title}
          className="tour-card-img"
        />
        {item.discount > 0 && (
          <Tag className="tour-card-discount-badge" icon={<FireOutlined />}>
            -{item.discount}%
          </Tag>
        )}
        <Tag className="tour-card-stock-badge" icon={<TeamOutlined />}>
          Còn {item.stock} chỗ
        </Tag>
      </div>

      {/* Body */}
      <div className="tour-card-body">
        <Title level={5} className="tour-card-title" title={item.title}>
          {item.title}
        </Title>
        <div className="tour-card-price-block">
          <span className="tour-card-price-special">
            {item.price_special?.toLocaleString("vi-VN")}đ
          </span>
          {item.discount > 0 && (
            <span className="tour-card-price-original">
              {item.price?.toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="tour-card-footer">
        <Button
          type="primary"
          className="tour-card-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tours/detail/${item.slug}`);
          }}
        >
          Xem chi tiết
        </Button>
      </div>
    </div>
  );
}

export default TourCard;
