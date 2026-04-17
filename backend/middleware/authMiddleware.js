const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

// Store isolation — prevents cross-store access
const enforceStoreIsolation = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    req.storeFilter = { storeId: req.user.storeId };
  } else {
    req.storeFilter = {};
  }
  next();
};

module.exports = { protect, allowRoles, enforceStoreIsolation };