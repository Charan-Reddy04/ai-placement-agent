export default (err, req, res, next) => {
  console.error(err);
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `${field} already exists` });
  }
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  res.status(status).json({
    message: process.env.NODE_ENV === "production" && status === 500 ? "Internal server error" : (err.message || "Server error")
  });
};
