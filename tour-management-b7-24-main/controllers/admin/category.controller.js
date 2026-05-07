import Category from "../../models/category.model.js";

export const index = async (req, res) => {
  try {
    const categories = await Category.findAll({ where: { deleted: false }, raw: true });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const detail = async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, deleted: false }, raw: true });
    if (!category) {
      res.status(404).json({ error: "Không tìm thấy danh mục" });
    } else {
      res.json({ category });
    }
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const createPost = async (req, res) => {
  try {
    const dataCategory = {
      title: req.body.title,
      description: req.body.description || "",
      status: req.body.status || "active",
      position: req.body.position ? parseInt(req.body.position) : await Category.count() + 1,
      image: req.body.image || "",
      slug: req.body.title.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") + "-" + Date.now(),
    };
    await Category.create(dataCategory);
    res.json({ code: "success", message: "Tạo danh mục thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const editPatch = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title, description: req.body.description, status: req.body.status,
    };
    if (req.body.position) updateData.position = parseInt(req.body.position);
    if (req.body.image) updateData.image = req.body.image;

    await Category.update(updateData, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Cập nhật danh mục thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const deletePatch = async (req, res) => {
  try {
    await Category.update({ deleted: true, deletedAt: new Date() }, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Xóa danh mục thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
