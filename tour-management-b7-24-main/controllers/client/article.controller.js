import Article from "../../models/article.model.js";
import ArticleTour from "../../models/article-tour.model.js";
import Tour from "../../models/tour.model.js";
import { Op } from "sequelize";

// [GET] /api/articles – Danh sách bài viết (public)
export const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;

    const where = { deleted: false, status: "active" };

    // Tìm kiếm theo tiêu đề HOẶC tag
    if (req.query.search && req.query.search.trim() !== "") {
      const searchStr = `%${req.query.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: searchStr } },
        { tags: { [Op.like]: searchStr } }
      ];
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "title", "slug", "summary", "thumbnail", "tags", "createdAt"],
      raw: true,
    });

    // Parse tags JSON
    articles.forEach((article) => {
      try {
        article.tags = JSON.parse(article.tags || "[]");
      } catch {
        article.tags = [];
      }
    });

    res.json({
      code: "success",
      articles,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách bài viết:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [GET] /api/articles/:slug – Chi tiết bài viết (public)
export const detail = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { slug: req.params.slug, deleted: false, status: "active" },
      raw: true,
    });

    if (!article) {
      return res.status(404).json({ error: "Bài viết không tồn tại" });
    }

    // Parse tags
    try {
      article.tags = JSON.parse(article.tags || "[]");
    } catch {
      article.tags = [];
    }

    // Lấy tours liên quan
    const articleTours = await ArticleTour.findAll({
      where: { article_id: article.id },
      raw: true,
    });

    let relatedTours = [];
    if (articleTours.length > 0) {
      const tourIds = articleTours.map((at) => at.tour_id);
      relatedTours = await Tour.findAll({
        where: { id: { [Op.in]: tourIds }, deleted: false, status: "active" },
        raw: true,
      });

      relatedTours.forEach((tour) => {
        if (tour.images) {
          try {
            const images = JSON.parse(tour.images);
            tour.image = images[0] || "";
          } catch {
            tour.image = "";
          }
        }
        tour.price_special = Math.round(tour.price * (1 - tour.discount / 100));
      });
    }

    res.json({
      code: "success",
      article,
      relatedTours,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết bài viết:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
