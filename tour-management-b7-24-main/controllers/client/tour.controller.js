import Tour from "../../models/tour.model.js";
import sequelize from "../../config/database.js";
import { QueryTypes } from "sequelize";

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
