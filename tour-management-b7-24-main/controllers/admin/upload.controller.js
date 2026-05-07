export const index = async (req, res) => {
  res.json({ location: req.body.file });
};
