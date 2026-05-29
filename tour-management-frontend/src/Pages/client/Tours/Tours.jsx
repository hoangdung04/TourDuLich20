import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Row, Col, Spin, Empty, Breadcrumb,
  Input, Select, Slider, Button, Pagination, Tag, Space, Tooltip,
} from "antd";
import {
  HomeOutlined, AppstoreOutlined,
  SearchOutlined, FilterOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { getToursByCategory } from "../../../services/api";
import BoxHead from "../../../components/BoxHead";
import TourCard from "../../../components/TourCard";
import "./Tours.css";

const { Option } = Select;
const PAGE_SIZE = 8;

function Tours() {
  const { slugCategory } = useParams();
  const [allTours, setAllTours]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Bộ lọc
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100_000_000]);
  const [maxPrice, setMaxPrice]   = useState(100_000_000);
  const [sortBy, setSortBy]       = useState(""); // "price_asc" | "price_desc" | "discount"

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const response = await getToursByCategory(slugCategory);
        const tours = response.data.tours || [];
        setAllTours(tours);
        // Tính max price để làm slider
        if (tours.length > 0) {
          const max = Math.max(...tours.map(t => t.price || 0));
          setMaxPrice(max || 100_000_000);
          setPriceRange([0, max || 100_000_000]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy tour:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
    // Reset bộ lọc khi đổi danh mục
    setSearch(""); setStatus(""); setSortBy(""); setCurrentPage(1);
  }, [slugCategory]);

  // Lọc + tìm kiếm + sắp xếp (client-side)
  const filteredTours = useMemo(() => {
    let list = [...allTours];

    // Tìm theo tên
    if (search.trim()) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(search.trim().toLowerCase())
      );
    }
    // Lọc trạng thái
    if (statusFilter) {
      list = list.filter(t => t.status === statusFilter);
    }
    // Lọc giá (theo giá gốc)
    list = list.filter(t => t.price >= priceRange[0] && t.price <= priceRange[1]);

    // Sắp xếp
    if (sortBy === "price_asc")  list.sort((a, b) => a.price_special - b.price_special);
    if (sortBy === "price_desc") list.sort((a, b) => b.price_special - a.price_special);
    if (sortBy === "discount")   list.sort((a, b) => b.discount - a.discount);

    return list;
  }, [allTours, search, statusFilter, priceRange, sortBy]);

  // Phân trang client-side
  const pagedTours = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTours.slice(start, start + PAGE_SIZE);
  }, [filteredTours, currentPage]);

  const handleReset = () => {
    setSearch(""); setStatus(""); setSortBy("");
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const handleFilterChange = () => setCurrentPage(1);

  const formatPrice = (v) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(0)}tr`
      : `${(v / 1_000).toFixed(0)}k`;

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

      {/* ====== Thanh tìm kiếm / lọc ====== */}
      <div style={{
        background: "#f8fffe",
        border: "1px solid #e8f5e9",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 24,
      }}>
        <Row gutter={[12, 12]} align="middle">
          {/* Tìm tên */}
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Tìm theo tên tour..."
              prefix={<SearchOutlined />}
              allowClear
              value={search}
              onChange={e => { setSearch(e.target.value); handleFilterChange(); }}
            />
          </Col>

          {/* Lọc trạng thái */}
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: "100%" }}
              value={statusFilter || undefined}
              onChange={val => { setStatus(val || ""); handleFilterChange(); }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="active">Còn chỗ</Option>
              <Option value="inactive">Hết chỗ</Option>
            </Select>
          </Col>

          {/* Sắp xếp */}
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Sắp xếp"
              allowClear
              style={{ width: "100%" }}
              value={sortBy || undefined}
              onChange={val => { setSortBy(val || ""); handleFilterChange(); }}
            >
              <Option value="price_asc">Giá tăng dần</Option>
              <Option value="price_desc">Giá giảm dần</Option>
              <Option value="discount">Giảm giá nhiều nhất</Option>
            </Select>
          </Col>

          {/* Đặt lại */}
          <Col xs={24} sm={2} md={2}>
            <Tooltip title="Đặt lại bộ lọc">
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
            </Tooltip>
          </Col>
        </Row>

        {/* Slider giá */}
        {!loading && maxPrice > 0 && (
          <div style={{ marginTop: 12 }}>
            <Space size={8} style={{ marginBottom: 6 }}>
              <FilterOutlined style={{ color: "#00b96b" }} />
              <span style={{ fontSize: 13, color: "#555" }}>
                Giá: <b style={{ color: "#00b96b" }}>{formatPrice(priceRange[0])}</b>
                {" — "}
                <b style={{ color: "#00b96b" }}>{formatPrice(priceRange[1])}</b>
              </span>
            </Space>
            <Slider
              range
              min={0}
              max={maxPrice}
              step={100_000}
              value={priceRange}
              onChange={val => { setPriceRange(val); handleFilterChange(); }}
              tooltip={{ formatter: v => `${(v / 1_000_000).toFixed(1)}tr đ` }}
              trackStyle={[{ background: "#00b96b" }]}
              handleStyle={[{ borderColor: "#00b96b" }, { borderColor: "#00b96b" }]}
            />
          </div>
        )}
      </div>

      {/* Kết quả */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Space>
          <Tag color="green">
            {filteredTours.length} tour
          </Tag>
          {(search || statusFilter || sortBy) && (
            <Tag color="orange">Đang lọc</Tag>
          )}
        </Space>
        <span style={{ color: "#888", fontSize: 13 }}>
          Trang {currentPage} / {Math.ceil(filteredTours.length / PAGE_SIZE) || 1}
        </span>
      </div>

      <Spin spinning={loading} size="large">
        {!loading && filteredTours.length === 0 ? (
          <Empty description="Không tìm thấy tour phù hợp" />
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {pagedTours.map(item => (
                <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                  <TourCard item={item} />
                </Col>
              ))}
            </Row>

            {/* Phân trang */}
            {filteredTours.length > PAGE_SIZE && (
              <div style={{ textAlign: "center", marginTop: 36 }}>
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={filteredTours.length}
                  onChange={page => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  showSizeChanger={false}
                  showTotal={total => `Tổng ${total} tour`}
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
}

export default Tours;
