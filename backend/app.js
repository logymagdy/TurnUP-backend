require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const path = require("path");

const app = express();
const server = http.createServer(app);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on("joinStore", (storeId) => {
    socket.join(`store:${storeId}`);
    console.log(`🏪 Socket joined store room: ${storeId}`);
  });

  socket.on("sendMessage", (payload) => {
    io.to(payload.receiverId).emit("newMessage", payload);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

// ✅ 1. Helmet — sets secure HTTP headers
// Protects against XSS, clickjacking, MIME sniffing etc.
app.use(helmet());

// ✅ 2. CORS — restrict to known origins
// For mobile app, allow all origins but restrict methods
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ 3. Body size limit — prevent DDoS via huge payloads
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ✅ 4. NoSQL injection sanitization
// Strips $ and . from request body, query, params
// Prevents MongoDB operator injection attacks
app.use(mongoSanitize());

// ─── RATE LIMITERS ────────────────────────────────────────────────────────────

// ✅ 5. General API rate limiter
// 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ 6. Strict auth rate limiter
// 10 attempts per 15 minutes per IP
// Prevents brute force on login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ 7. OTP rate limiter
// 5 OTP requests per 15 minutes per IP
// Prevents OTP brute force and spam
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ 8. Booking rate limiter
// 20 bookings per hour per IP
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many booking attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── DATABASE ─────────────────────────────────────────────────────────────────
connectDB();

const PORT = process.env.PORT || 3000;

// ─── SWAGGER DOCS ─────────────────────────────────────────────────────────────
try {
  const swaggerUi = require("swagger-ui-express");
  const swaggerPath = path.resolve(__dirname, "./swagger-output.json");
  const swaggerFile = require(swaggerPath);

  swaggerFile.host =
    process.env.NODE_ENV === "production"
      ? "turnup-backend-j5nf.onrender.com"
      : `localhost:${PORT}`;

  swaggerFile.schemes =
    process.env.NODE_ENV === "production" ? ["https"] : ["http"];

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
} catch (e) {
  console.log("Swagger not available yet");
}

// ─── BACKGROUND JOBS ──────────────────────────────────────────────────────────
try {
  const { runQueueExpiryJob } = require("./services/queueExpiryJob");
  setInterval(() => runQueueExpiryJob(io), 60 * 1000);
} catch (e) {
  console.log("Queue expiry job not available");
}

try {
  const { runSuspensionLiftJob } = require("./services/suspensionLiftJob");
  setInterval(() => runSuspensionLiftJob(), 5 * 60 * 1000);
} catch (e) {
  console.log("Suspension lift job not available");
}

// ─── APPLY GENERAL RATE LIMITER TO ALL API ROUTES ────────────────────────────
app.use("/api/", generalLimiter);

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// ✅ Auth routes with strict rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", otpLimiter);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth/resend-otp", otpLimiter);
app.use("/api/auth", require("./routes/authRoutes"));

// ✅ User routes
app.use("/api/users", require("./routes/userRoutes"));

// ✅ Store routes
app.use("/api/store", require("./routes/storeRoutes"));
app.use("/api/salons", require("./routes/storeRoutes"));

// ✅ Queue & Booking with rate limiter
app.use("/api/queue", require("./routes/queueRoutes"));
app.use("/api/booking/create", bookingLimiter);
app.use("/api/booking", require("./routes/bookingRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

// ✅ Check-in
app.use("/api/checkin", require("./routes/checkInRoutes"));

// ✅ Notifications
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ✅ Payment
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// ✅ Loyalty & Wallet
app.use("/api/loyalty", require("./routes/loyaltyRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));

// ✅ Promotions
try {
  app.use("/api/promotion", require("./routes/promotionRoutes"));
} catch (e) {
  console.log("promotionRoutes not available yet");
}

// ✅ Complaints
app.use("/api/complaint", require("./routes/complaintRoutes"));

// ✅ Analytics & Admin
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "TurnUP API running ✅",
    version: "1.2.0",
    status: "Fully Operational",
  });
});

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Critical Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    // ✅ Never expose error details in production
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 TurnUP server running on port ${PORT}`);
});

module.exports = app;