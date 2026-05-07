import Category from "../../models/category.model.js";

export const index = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { deleted: false, status: "active" }, raw: true
    });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
