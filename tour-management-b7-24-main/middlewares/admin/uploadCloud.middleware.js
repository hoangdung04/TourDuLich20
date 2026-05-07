import { streamUpload } from "../../helpers/streamUpload.helper.js";

export const uploadSingle = (req, res, next) => {
  if(req["file"]) {
    async function upload(req) {
      let result = await streamUpload(req["file"].buffer);
      req.body[req["file"].fieldname] = result["url"];
      next();
    }

    upload(req);
  } else {
    next();
  }
}

export const uploadFields = async (req, res, next) => {
  for (const key in req["files"]) {
    req.body[key] = [];

    const array = req["files"][key];
    for (const item of array) {
      try {
        const result = await streamUpload(item.buffer);
        req.body[key].push(result["url"]);
      } catch (error) {
        console.log(error);
      }
    }
  }

  next();
}
