import Tour from "../../models/tour.model.js";

export const list = async (req, res) => {
  try {
    const tours = req.body;
    let total = 0;
    for (const tour of tours) {
      const infoTour = await Tour.findOne({ where: { id: tour.tourId }, raw: true });
      if (!infoTour) continue;

      if (infoTour["images"]) {
        try {
          infoTour["images"] = JSON.parse(infoTour["images"]);
        } catch (e) {
          infoTour["images"] = [];
        }
        tour["image"] = infoTour["images"] && infoTour["images"].length > 0 ? infoTour["images"][0] : "";
      } else {
        tour["image"] = "";
      }
      tour["title"] = infoTour["title"];
      tour["slug"] = infoTour["slug"];
      
      const priceSpecial = Math.round((1 - infoTour["discount"] / 100) * infoTour["price"]);
      tour["price_special"] = priceSpecial;

      const adultsQuantity = parseInt(tour.adultsQuantity) || 1;
      const childrenQuantity = parseInt(tour.childrenQuantity) || 0;
      const toddlersQuantity = parseInt(tour.toddlersQuantity) || 0;
      const infantsQuantity = parseInt(tour.infantsQuantity) || 0;
      const seniorsQuantity = parseInt(tour.seniorsQuantity) || 0;
      const visaQuantity = parseInt(tour.visaQuantity) || 0;
      const singleRoomQuantity = parseInt(tour.singleRoomQuantity) || 0;

      const adultsPrice = priceSpecial * adultsQuantity;
      const childrenPrice = Math.round(priceSpecial * 0.7) * childrenQuantity;
      const toddlersPrice = Math.round(priceSpecial * 0.5) * toddlersQuantity;
      const infantsPrice = 0; // Trẻ sơ sinh miễn phí
      const seniorsPrice = Math.round(priceSpecial * 0.6) * seniorsQuantity; // Người cao tuổi giảm 40%
      const visaPrice = 1500000 * visaQuantity;
      const singleRoomPrice = 3500000 * singleRoomQuantity;

      tour["quantity"] = adultsQuantity + childrenQuantity + toddlersQuantity + infantsQuantity + seniorsQuantity;
      tour["total"] = adultsPrice + childrenPrice + toddlersPrice + infantsPrice + seniorsPrice + visaPrice + singleRoomPrice;
      total += tour["total"];
    }
    res.json({ tours, total });
  } catch (error) {
    console.error("Lỗi api /cart/list:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
