import { Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./CategoryCard.css";

const { Title, Text } = Typography;

function CategoryCard({ item }) {
  const navigate = useNavigate();

  return (
    <div
      className="category-card"
      onClick={() => navigate(`/tours/${item.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/tours/${item.slug}`)}
    >
      {/* Background image */}
      <div className="category-card-img-wrapper">
        <img
          src={item.image || "https://placehold.co/400x220?text=Category"}
          alt={item.title}
          className="category-card-img"
        />
      </div>

      {/* Dark/green overlay */}
      <div className="category-card-overlay" />

      {/* Hover arrow */}
      <div className="category-card-arrow">
        <ArrowRightOutlined />
      </div>

      {/* Text content */}
      <div className="category-card-content">
        <Title level={5} className="category-card-title">
          {item.title}
        </Title>
        {item.description && (
          <Text className="category-card-desc">
            {item.description}
          </Text>
        )}
      </div>
    </div>
  );
}

export default CategoryCard;
