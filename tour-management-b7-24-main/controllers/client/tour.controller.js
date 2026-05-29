import Tour from "../../models/tour.model.js";
import sequelize from "../../config/database.js";
import { QueryTypes } from "sequelize";

// [GET] /api/tours/featured — Tour nổi bật cho trang chủ
export const featured = async (req, res) => {
  try {
    // Tour giảm giá nhiều nhất (top 8)
    const bestDeals = await sequelize.query(`
      SELECT id, title, slug, price, discount, stock, status,
             price * (1 - discount/100) AS price_special, images
      FROM tours
      WHERE deleted = false AND status = 'active' AND discount > 0
      ORDER BY discount DESC
      LIMIT 8
    `, { type: QueryTypes.SELECT });

    // Tour mới nhất (top 8)
    const newest = await sequelize.query(`
      SELECT id, title, slug, price, discount, stock, status,
             price * (1 - discount/100) AS price_special, images
      FROM tours
      WHERE deleted = false AND status = 'active'
      ORDER BY createdAt DESC
      LIMIT 8
    `, { type: QueryTypes.SELECT });

    const processTour = (t) => {
      if (t.images) {
        t.images = JSON.parse(t.images);
        t.image = t.images[0];
      }
      t.price_special = parseInt(t.price_special);
      return t;
    };

    res.json({
      bestDeals: bestDeals.map(processTour),
      newest:    newest.map(processTour),
    });
  } catch (error) {
    console.error("Featured error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [GET] /api/tours/search?keyword=... — Tìm kiếm tour
export const search = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    if (!keyword.trim()) {
      return res.json({ tours: [] });
    }

    const tours = await sequelize.query(`
      SELECT id, title, slug, price, discount, stock, status,
             price * (1 - discount/100) AS price_special, images
      FROM tours
      WHERE deleted = false AND status = 'active'
        AND title LIKE :keyword
      ORDER BY discount DESC
      LIMIT 20
    `, {
      type: QueryTypes.SELECT,
      replacements: { keyword: `%${keyword}%` },
    });

    for (const t of tours) {
      if (t.images) {
        t.images = JSON.parse(t.images);
        t.image = t.images[0];
      }
      t.price_special = parseInt(t.price_special);
    }

    res.json({ tours });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [GET] /api/tours/by-categories — Tour nhóm theo danh mục (cho trang chủ)
export const byCategories = async (req, res) => {
  try {
    // Lấy danh mục active
    const categories = await sequelize.query(`
      SELECT id, title, slug, image FROM categories
      WHERE deleted = false AND status = 'active'
      ORDER BY position ASC
      LIMIT 6
    `, { type: QueryTypes.SELECT });

    // Cho mỗi danh mục, lấy 4 tour
    for (const cat of categories) {
      const tours = await sequelize.query(`
        SELECT t.id, t.title, t.slug, t.price, t.discount, t.stock, t.status,
               t.price * (1 - t.discount/100) AS price_special, t.images
        FROM tours t
        JOIN tours_categories tc ON t.id = tc.tour_id
        WHERE tc.category_id = :catId AND t.deleted = false AND t.status = 'active'
        ORDER BY t.discount DESC
        LIMIT 4
      `, { type: QueryTypes.SELECT, replacements: { catId: cat.id } });

      for (const t of tours) {
        if (t.images) {
          t.images = JSON.parse(t.images);
          t.image = t.images[0];
        }
        t.price_special = parseInt(t.price_special);
      }
      cat.tours = tours;
    }

    res.json({ categories });
  } catch (error) {
    console.error("By categories error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const detail = async (req, res) => {
  try {
    const slugTour = req.params.slugTour;
    const tourDetail = await Tour.findOne({
      where: { slug: slugTour, deleted: false, status: "active" }, raw: true
    });
    if (!tourDetail) {
      res.status(404).json({ error: "Tour không tồn tại" });
    } else {
      if (tourDetail["images"]) tourDetail["images"] = JSON.parse(tourDetail["images"]);
      tourDetail["price_special"] = (1 - tourDetail["discount"] / 100) * tourDetail["price"];
      res.json({ tourDetail });
    }
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const list = async (req, res) => {
  try {
    const slugCategory = req.params.slugCategory;
    const tours = await sequelize.query(`
      SELECT tours.*, price * (1 - discount/100) AS price_special
      FROM tours
      JOIN tours_categories ON tours.id = tours_categories.tour_id
      JOIN categories ON tours_categories.category_id = categories.id
      WHERE categories.slug = :slugCategory AND categories.deleted = false AND categories.status = 'active'
      AND tours.deleted = false AND tours.status = 'active';
    `, { type: QueryTypes.SELECT, replacements: { slugCategory } });

    for (const item of tours) {
      if (item["images"]) {
        item["images"] = JSON.parse(item["images"]);
        item["image"] = item["images"][0];
        item["price_special"] = parseInt(item["price_special"]);
      }
    }
    res.json({ tours });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
