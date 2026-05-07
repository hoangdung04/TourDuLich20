import Tour from "../../models/tour.model.js";
import Category from "../../models/category.model.js";
import TourCategory from "../../models/tour-category.model.js";
import { generateTourCode } from "../../helpers/generate.helper.js";

export const index = async (req, res) => {
  try {
    const tours = await Tour.findAll({ where: { deleted: false }, raw: true });
    tours.forEach(item => {
      if (item["images"]) {
        const images = JSON.parse(item["images"]);
        item["image"] = images[0];
      }
      item["price_special"] = (item["price"] * (1 - item["discount"] / 100));
    });
    res.json({ tours });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ where: { deleted: false, status: 'active' }, raw: true });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const createPost = async (req, res) => {
  try {
    if (req.body.position == "") {
      const countTour = await Tour.count();
      req.body.position = countTour + 1;
    } else {
      req.body.position = parseInt(req.body.position);
    }
    const dataTour = {
      title: req.body.title, code: "", price: parseInt(req.body.price), discount: parseInt(req.body.discount), stock: parseInt(req.body.stock),
      timeStart: req.body.timeStart, position: req.body.position, status: req.body.status, images: JSON.stringify(req.body.images),
      information: req.body.information, schedule: req.body.schedule,
    };
    const tour = await Tour.create(dataTour);
    const tourId = tour.dataValues.id;
    const code = generateTourCode(tourId);
    await Tour.update({ code }, { where: { id: tourId } });
    const dataTourCategory = { tour_id: tourId, category_id: parseInt(req.body.category_id) };
    await TourCategory.create(dataTourCategory);
    res.json({ code: "success", message: "Tạo tour thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const detail = async (req, res) => {
  try {
    const tour = await Tour.findOne({ where: { id: req.params.id, deleted: false }, raw: true });
    if (!tour) {
      res.status(404).json({ error: "Không tìm thấy tour" });
    } else {
      if (tour["images"]) tour["images"] = JSON.parse(tour["images"]);
      const tourCategory = await TourCategory.findOne({ where: { tour_id: req.params.id }, raw: true });
      res.json({ tour, category_id: tourCategory ? tourCategory["category_id"] : null });
    }
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const editPatch = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title, price: parseInt(req.body.price), discount: parseInt(req.body.discount), stock: parseInt(req.body.stock),
      status: req.body.status, information: req.body.information, schedule: req.body.schedule,
    };
    if (req.body.position) updateData.position = parseInt(req.body.position);
    if (req.body.timeStart) updateData.timeStart = req.body.timeStart;
    if (req.body.images && req.body.images.length > 0) {
      updateData.images = JSON.stringify(req.body.images);
    }
    await Tour.update(updateData, { where: { id: req.params.id } });
    if (req.body.category_id) {
      await TourCategory.update({ category_id: parseInt(req.body.category_id) }, { where: { tour_id: req.params.id } });
    }
    res.json({ code: "success", message: "Cập nhật tour thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const deletePatch = async (req, res) => {
  try {
    await Tour.update({ deleted: true, deletedAt: new Date() }, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Xóa tour thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
