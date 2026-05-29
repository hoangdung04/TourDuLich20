import Article from "../../models/article.model.js";
import ArticleTour from "../../models/article-tour.model.js";
import Tour from "../../models/tour.model.js";
import { Op } from "sequelize";

// [GET] /api/admin/articles – Danh sách bài viết
export const index = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { deleted: false };

    if (req.query.search && req.query.search.trim() !== "") {
      where.title = { [Op.like]: `%${req.query.search.trim()}%` };
    }

    if (req.query.status && req.query.status !== "") {
      where.status = req.query.status;
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    articles.forEach((article) => {
      try {
        article.tags = JSON.parse(article.tags || "[]");
      } catch {
        article.tags = [];
      }
    });

    res.json({
      articles,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/admin/articles/:id – Chi tiết bài viết
export const detail = async (req, res, next) => {
  try {
    const article = await Article.findOne({
      where: { id: req.params.id, deleted: false },
      raw: true,
    });

    if (!article) {
      return res.status(404).json({ error: "Bài viết không tồn tại" });
    }

    try {
      article.tags = JSON.parse(article.tags || "[]");
    } catch {
      article.tags = [];
    }

    // Lấy danh sách tour_id liên kết
    const articleTours = await ArticleTour.findAll({
      where: { article_id: article.id },
      attributes: ["tour_id"],
      raw: true,
    });
    article.tourIds = articleTours.map((at) => at.tour_id);

    res.json({ article });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/admin/articles/create – Tạo bài viết
export const createPost = async (req, res, next) => {
  try {
    const { title, summary, content, tags, status, tourIds } = req.body;

    // Thumbnail đã được upload middleware xử lý
    const thumbnail = req.body.thumbnail
      ? (Array.isArray(req.body.thumbnail) ? req.body.thumbnail[0] : req.body.thumbnail)
      : "";

    const article = await Article.create({
      title,
      summary: summary || "",
      content: content || "",
      thumbnail,
      tags: JSON.stringify(tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : []),
      status: status || "active",
    });

    // Liên kết tours
    if (tourIds) {
      const ids = Array.isArray(tourIds) ? tourIds : JSON.parse(tourIds);
      const records = ids.map((tourId) => ({
        article_id: article.id,
        tour_id: parseInt(tourId),
      }));
      if (records.length > 0) {
        await ArticleTour.bulkCreate(records);
      }
    }

    res.json({ code: "success", message: "Tạo bài viết thành công!" });
  } catch (error) {
    next(error);
  }
};

// [PATCH] /api/admin/articles/:id – Cập nhật bài viết
export const editPatch = async (req, res, next) => {
  try {
    const { title, summary, content, tags, status, tourIds } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;

    if (tags !== undefined) {
      updateData.tags = JSON.stringify(Array.isArray(tags) ? tags : JSON.parse(tags));
    }

    // Thumbnail mới (nếu có upload)
    if (req.body.thumbnail) {
      updateData.thumbnail = Array.isArray(req.body.thumbnail)
        ? req.body.thumbnail[0]
        : req.body.thumbnail;
    }

    await Article.update(updateData, { where: { id: req.params.id } });

    // Cập nhật liên kết tours
    if (tourIds !== undefined) {
      await ArticleTour.destroy({ where: { article_id: req.params.id } });
      const ids = Array.isArray(tourIds) ? tourIds : JSON.parse(tourIds);
      const records = ids.map((tourId) => ({
        article_id: parseInt(req.params.id),
        tour_id: parseInt(tourId),
      }));
      if (records.length > 0) {
        await ArticleTour.bulkCreate(records);
      }
    }

    res.json({ code: "success", message: "Cập nhật bài viết thành công!" });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/admin/articles/:id – Xóa bài viết (soft delete)
export const deletePatch = async (req, res, next) => {
  try {
    await Article.update(
      { deleted: true, deletedAt: new Date() },
      { where: { id: req.params.id } }
    );
    res.json({ code: "success", message: "Xóa bài viết thành công!" });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/admin/articles/tours – Lấy danh sách tours để chọn liên kết
export const getTours = async (req, res, next) => {
  try {
    const tours = await Tour.findAll({
      where: { deleted: false, status: "active" },
      attributes: ["id", "title"],
      raw: true,
    });
    res.json({ tours });
  } catch (error) {
    next(error);
  }
};
