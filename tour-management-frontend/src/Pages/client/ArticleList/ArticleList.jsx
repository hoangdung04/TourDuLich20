import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input, Pagination, Spin, Empty, Tag } from "antd";
import { SearchOutlined, CalendarOutlined, ReadOutlined } from "@ant-design/icons";
import { getArticles } from "../../../services/api";
import BoxHead from "../../../components/BoxHead";
import dayjs from "dayjs";
import "./ArticleList.css";

const { Search } = Input;

function ArticleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");

  const fetchArticles = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await getArticles({ page, limit: 9, search });
      setArticles(res.data.articles || []);
      setTotalItems(res.data.totalItems || 0);
      setCurrentPage(res.data.currentPage || 1);
    } catch (error) {
      console.error("Lỗi lấy bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(currentPage, searchText);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    setSearchParams(value ? { search: value } : {});
    fetchArticles(1, value);
  };

  const handleTagClick = (e, tag) => {
    e.preventDefault(); // Ngăn cản click tag nhảy vào trang chi tiết bài viết
    setSearchText(tag);
    setSearchParams({ search: tag });
    fetchArticles(1, tag);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchArticles(page, searchText);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="article-list-page">
      <BoxHead
        title="Cẩm nang du lịch"
        subtitle="Khám phá những bài viết hữu ích cho chuyến đi của bạn"
      />

      <div className="article-list-toolbar">
        <Search
          placeholder="Tìm kiếm bài viết..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="article-search"
        />
      </div>

      {loading ? (
        <div className="article-loading">
          <Spin size="large" />
        </div>
      ) : articles.length === 0 ? (
        <Empty
          image={<ReadOutlined className="article-empty-icon" />}
          description="Chưa có bài viết nào"
        />
      ) : (
        <>
          <div className="article-grid">
            {articles.map((article) => (
              <Link
                to={`/articles/${article.slug}`}
                key={article.id}
                className="article-card"
              >
                <div className="article-card-image">
                  <img
                    src={article.thumbnail || "https://placehold.co/400x250?text=No+Image"}
                    alt={article.title}
                  />
                </div>
                <div className="article-card-body">
                  <div className="article-card-tags">
                    {(article.tags || []).slice(0, 3).map((tag, i) => (
                      <Tag
                        key={i}
                        color="blue"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => handleTagClick(e, tag)}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <h3 className="article-card-title">{article.title}</h3>
                  <p className="article-card-summary">{article.summary}</p>
                  <div className="article-card-date">
                    <CalendarOutlined />
                    <span>{dayjs(article.createdAt).format("DD/MM/YYYY")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalItems > 9 && (
            <div className="article-pagination">
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={9}
                onChange={handlePageChange}
                showTotal={(t) => `Tổng ${t} bài viết`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ArticleList;
