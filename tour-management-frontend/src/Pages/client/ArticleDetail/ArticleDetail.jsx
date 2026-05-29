import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Spin, Tag, Card, Typography, Empty } from "antd";
import { CalendarOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getArticleDetail } from "../../../services/api";
import dayjs from "dayjs";
import "react-quill-new/dist/quill.snow.css";
import "./ArticleDetail.css";

const { Title, Text } = Typography;

function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedTours, setRelatedTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await getArticleDetail(slug);
        setArticle(res.data.article);
        setRelatedTours(res.data.relatedTours || []);
      } catch (error) {
        console.error("Lỗi lấy bài viết:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) {
    return (
      <div className="article-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-detail-page">
        <Empty description="Bài viết không tồn tại" />
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      <div className="article-detail-container">
        {/* Back link */}
        <Link to="/articles" className="article-back-link">
          <ArrowLeftOutlined /> Quay lại danh sách
        </Link>

        {/* Header */}
        <div className="article-detail-header">
          <div className="article-detail-tags">
            {(article.tags || []).map((tag, i) => (
              <Tag key={i} color="blue">{tag}</Tag>
            ))}
          </div>
          <h1 className="article-detail-title">{article.title}</h1>
          <div className="article-detail-meta">
            <CalendarOutlined />
            <span>{dayjs(article.createdAt).format("DD/MM/YYYY HH:mm")}</span>
          </div>
        </div>

        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="article-detail-thumbnail">
            <img src={article.thumbnail} alt={article.title} />
          </div>
        )}

        {/* Summary */}
        {article.summary && (
          <div className="article-detail-summary">
            <p>{article.summary}</p>
          </div>
        )}

        {/* Content (HTML from Rich Text Editor) */}
        <div
          className="article-detail-content ql-editor"
          dangerouslySetInnerHTML={{
            __html: (() => {
              // Giải mã HTML entities (ví dụ: &lt; thành <) nếu database bị lưu sai format
              const txt = document.createElement("textarea");
              txt.innerHTML = article.content || "";
              return txt.value;
            })()
          }}
        />

        {/* Related Tours */}
        {relatedTours.length > 0 && (
          <div className="article-related-tours">
            <Title level={3} className="related-tours-title">
              🗺️ Tour liên quan
            </Title>
            <div className="related-tours-grid">
              {relatedTours.map((tour) => (
                <Link
                  to={`/tours/detail/${tour.slug}`}
                  key={tour.id}
                  className="related-tour-card"
                >
                  <div className="related-tour-image">
                    <img
                      src={tour.image || "https://placehold.co/300x180?text=Tour"}
                      alt={tour.title}
                    />
                    {tour.discount > 0 && (
                      <span className="related-tour-discount">-{tour.discount}%</span>
                    )}
                  </div>
                  <div className="related-tour-info">
                    <Text strong className="related-tour-title">{tour.title}</Text>
                    <div className="related-tour-price">
                      {tour.discount > 0 && (
                        <Text delete type="secondary" style={{ fontSize: 13 }}>
                          {tour.price?.toLocaleString("vi-VN")}đ
                        </Text>
                      )}
                      <Text strong style={{ color: "#f5222d", fontSize: 16 }}>
                        {tour.price_special?.toLocaleString("vi-VN")}đ
                      </Text>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticleDetail;
