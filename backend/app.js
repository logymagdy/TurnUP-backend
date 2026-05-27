require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ✅ Client joins their own room for personal notifications
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // ✅ Store joins store room for queue updates
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

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

const PORT = process.env.PORT || 3000;

// ─── SWAGGER ──────────────────────────────────────────────────────────────────
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
app.use("/api/wallet", require("./routes/walletRoutes"));  // ✅ NEW
app.use("/api/promotion", require("./routes/promotionRoutes"));
app.use("/api/complaint", require("./routes/complaintRoutes"));
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

// ─── 404 ──────────────────────────────────────────────────────────────────────
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

server.listen(PORT, () => {
  console.log(`🚀 TurnUP server running on port ${PORT}`);
});

module.exports = app;