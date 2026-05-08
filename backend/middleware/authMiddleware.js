const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attaching the user payload (id, role, storeId) to the request object
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid or has expired" });
  }
};

/**
 * ALLOW ROLES: Restricts access to specific user types
 * Use:
 * allowRoles("serviceProvider", "ADMIN")
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Safety check: ensure 'protect' middleware was called first
    if (!req.user) {
      return res.status(500).json({
        message: "Internal Auth Error: User object missing",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: Role '${req.user.role}' is not authorized for this action`,
      });
    }

    next();
  };
};

/**
 * ENFORCE STORE ISOLATION: Data Security
 * Prevents a provider from one shop seeing/editing data from another shop.
 */
const enforceStoreIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Admins can see everything; others are locked to their own store
  if (req.user.role !== "ADMIN") {
    if (!req.user.storeId) {
      return res.status(403).json({
        message: "Access denied: User is not linked to a store",
      });
    }

    req.storeFilter = { storeId: req.user.storeId };
  } else {
    req.storeFilter = {}; // Admin bypass
  }

  next();
};

module.exports = { protect, allowRoles, enforceStoreIsolation };