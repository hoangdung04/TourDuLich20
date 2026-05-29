import Tour from "../../models/tour.model.js";
import Category from "../../models/category.model.js";
import TourCategory from "../../models/tour-category.model.js";
import { generateTourCode } from "../../helpers/generate.helper.js";
import { Op } from "sequelize";
import sequelize from "../../config/database.js";
import { QueryTypes } from "sequelize";

export const index = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // --- Build WHERE clause cho Tour ---
    const where = { deleted: false };

    // Tìm kiếm theo tiêu đề
    if (req.query.search && req.query.search.trim() !== "") {
      where.title = { [Op.like]: `%${req.query.search.trim()}%` };
    }

    // Lọc theo trạng thái
    if (req.query.status && req.query.status !== "") {
      where.status = req.query.status;
    }

    // Lọc theo danh mục: cần subquery lấy tour_id từ tours_categories
    if (req.query.category_id && req.query.category_id !== "") {
      const catId = parseInt(req.query.category_id);
      const tourIds = await TourCategory.findAll({
        where:      { category_id: catId },
        attributes: ['tour_id'],
        raw:        true,
      });
      where.id = { [Op.in]: tourIds.map(t => t.tour_id) };
    }

    const { count, rows: tours } = await Tour.findAndCountAll({
      where,
      offset,
      limit,
      raw: true,
    });

    tours.forEach(item => {
      if (item["images"]) {
        const images = JSON.parse(item["images"]);
        item["image"] = images[0];
      }
      item["price_special"] = (item["price"] * (1 - item["discount"] / 100));
    });
    
    res.json({ 
      tours, 
      totalPages:  Math.ceil(count / limit), 
      currentPage: page,
      totalItems:  count,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ where: { deleted: false, status: 'active' }, raw: true });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
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
    next(error);
  }
};

export const detail = async (req, res, next) => {
  try {
    const tour = await Tour.findOne({ where: { id: req.params.id, deleted: false }, raw: true });
    if (!tour) {
      const err = new Error("Không tìm thấy tour");
      err.statusCode = 404;
      return next(err);
    } else {
      if (tour["images"]) tour["images"] = JSON.parse(tour["images"]);
      const tourCategory = await TourCategory.findOne({ where: { tour_id: req.params.id }, raw: true });
      res.json({ tour, category_id: tourCategory ? tourCategory["category_id"] : null });
    }
  } catch (error) {
    next(error);
  }
};

export const editPatch = async (req, res, next) => {
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
    next(error);
  }
};

export const deletePatch = async (req, res, next) => {
  try {
    await Tour.update({ deleted: true, deletedAt: new Date() }, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Xóa tour thành công!" });
  } catch (error) {
    next(error);
  }
};
