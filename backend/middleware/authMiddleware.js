const jwt = require("jsonwebtoken");

// ─── PROTECT ──────────────────────────────────────────────────────────────────
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ✅ Check header exists and starts with Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  // ✅ Check token is not empty
  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Validate token has required fields
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    // ✅ Specific error messages for different JWT errors
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired. Please refresh your token.",
        code: "TOKEN_EXPIRED",
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
        code: "TOKEN_INVALID",
      });
    }
    return res.status(401).json({ message: "Token verification failed" });
  }
};

// ─── ALLOW ROLES ──────────────────────────────────────────────────────────────
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ message: "Internal Auth Error: User missing" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: Role '${req.user.role}' is not authorized`,
        code: "FORBIDDEN",
      });
    }
    next();
  };
};

// ─── ENFORCE STORE ISOLATION ──────────────────────────────────────────────────
const enforceStoreIsolation = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  if (req.user.role !== "ADMIN") {
    if (!req.user.storeId) {
      return res.status(403).json({
        message: "Access denied: Not linked to a store",
        code: "NO_STORE",
      });
    }
    req.storeFilter = { storeId: req.user.storeId };
  } else {
    req.storeFilter = {};
  }

  next();
};

// ─── OPTIONAL AUTH ────────────────────────────────────────────────────────────
// ✅ Used for routes that work both logged in and logged out
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  if (!token || token === "undefined" || token === "null") {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }

  next();
};

module.exports = { protect, allowRoles, enforceStoreIsolation, optionalAuth };