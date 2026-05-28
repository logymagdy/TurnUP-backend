require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
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

// ✅ 1. Helmet — secure HTTP headers
app.use(helmet());

// ✅ 2. CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ 3. Body size limit — prevent large payload attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── RATE LIMITERS ────────────────────────────────────────────────────────────

// ✅ General — 100 requests per 15 mins
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

// ✅ Auth — 10 attempts per 15 mins
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

// ✅ OTP — 5 requests per 15 mins
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

// ✅ Booking — 20 per hour
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
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
  console.log("Swagger loaded from:", swaggerPath);
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

// ─── APPLY RATE LIMITERS ──────────────────────────────────────────────────────
app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", otpLimiter);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth/resend-otp", otpLimiter);
app.use("/api/booking/create", bookingLimiter);

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/store", require("./routes/storeRoutes"));
app.use("/api/salons", require("./routes/storeRoutes"));
app.use("/api/queue", require("./routes/queueRoutes"));
app.use("/api/booking", require("./routes/bookingRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/checkin", require("./routes/checkInRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/loyalty", require("./routes/loyaltyRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/complaint", require("./routes/complaintRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

try {
  app.use("/api/promotion", require("./routes/promotionRoutes"));
} catch (e) {
  console.log("promotionRoutes not available yet");
}

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
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 TurnUP server running on port ${PORT}`);
});

module.exports = app;