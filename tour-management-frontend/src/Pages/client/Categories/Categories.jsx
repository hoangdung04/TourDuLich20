import { useState, useEffect } from "react";
import { Row, Col, Spin, Empty, Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getCategories } from "../../../services/api";
import BoxHead from "../../../components/BoxHead";
import CategoryCard from "../../../components/CategoryCard";
import "./Categories.css";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: "Danh mục tour" },
        ]}
      />

      <BoxHead
        title="Danh mục tour"
        subtitle="Chọn danh mục để khám phá các tour hấp dẫn"
      />
      <Spin spinning={loading} size="large">
        {!loading && categories.length === 0 ? (
          <Empty description="Chưa có danh mục nào" />
        ) : (
          <Row gutter={[24, 24]}>
            {categories.map((item) => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <CategoryCard item={item} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}

export default Categories;
