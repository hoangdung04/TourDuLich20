import Tour from "../../models/tour.model.js";

export const list = async (req, res) => {
  try {
    const tours = req.body;
    let total = 0;
    for (const tour of tours) {
      const infoTour = await Tour.findOne({ where: { id: tour.tourId }, raw: true });
      if (infoTour["images"]) {
        infoTour["images"] = JSON.parse(infoTour["images"]);
        tour["image"] = infoTour["images"][0];
      }
      tour["title"] = infoTour["title"];
      tour["slug"] = infoTour["slug"];
      tour["price_special"] = (1 - infoTour["discount"] / 100) * infoTour["price"];
      tour["total"] = tour["price_special"] * tour["quantity"];
      total += tour["total"];
    }
    res.json({ tours, total });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
