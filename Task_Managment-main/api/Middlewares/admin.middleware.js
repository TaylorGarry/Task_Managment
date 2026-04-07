export const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.accountType !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
