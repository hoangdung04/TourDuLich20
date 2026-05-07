import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Spin, Empty, Breadcrumb } from "antd";
import { HomeOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getToursByCategory } from "../../../services/api";
import BoxHead from "../../../components/BoxHead";
import TourCard from "../../../components/TourCard";

function Tours() {
  const { slugCategory } = useParams();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const response = await getToursByCategory(slugCategory);
        setTours(response.data.tours);
      } catch (error) {
        console.error("Lỗi khi lấy tour:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, [slugCategory]);

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: <Link to="/categories"><AppstoreOutlined /> Danh mục</Link> },
          { title: slugCategory },
        ]}
      />
      <BoxHead title="Danh sách tour" subtitle="Tìm tour phù hợp với bạn" />
      <Spin spinning={loading} size="large">
        {!loading && tours.length === 0 ? (
          <Empty description="Không có tour nào trong danh mục này" />
        ) : (
          <Row gutter={[24, 24]}>
            {tours.map((item) => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <TourCard item={item} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}

export default Tours;
