import { isPrivilegedUser } from "../utils/roleAccess.js";

export const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || !isPrivilegedUser(req.user)) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
