const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "No token, authorization denied" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(401).json({ message: "User no longer exists" });

    req.user = {
      id: user._id,
      role: user.role,
      storeId: user.storeId || null,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid or has expired" });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(500).json({ message: "Internal Auth Error: User object missing" });

    if (!roles.includes(req.user.role))
      return res.status(403).json({
        message: `Access denied: Role '${req.user.role}' is not authorized for this action`,
      });

    next();
  };
};

const enforceStoreIsolation = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  if (req.user.role !== "ADMIN") {
    if (!req.user.storeId)
      return res.status(403).json({ message: "Access denied: User is not linked to a store" });

    req.storeFilter = { storeId: req.user.storeId };
  } else {
    req.storeFilter = {};
  }

  next();
};

const requireActiveStore = async (req, res, next) => {
  try {
    const Store = require("../models/storeModel");
    const storeId = req.user.storeId;

    if (!storeId)
      return res.status(403).json({ message: "No store associated with this account" });

    const store = await Store.findById(storeId).select("status approvalStatus subscriptionStatus");
    if (!store)
      return res.status(404).json({ message: "Store not found" });

    if (store.approvalStatus !== "APPROVED")
      return res.status(403).json({ message: "Store is not approved yet" });

    if (store.status === "SUSPENDED")
      return res.status(403).json({ message: "Store is suspended. Contact support." });

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { protect, allowRoles, enforceStoreIsolation, requireActiveStore };