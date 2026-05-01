require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

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

  // Client joins their own room to receive personal notifications
  socket.on("joinClient", (clientId) => {
    socket.join(`client:${clientId}`);
    console.log(`📱 Client ${clientId} joined their personal room`);
  });

  socket.on("sendMessage", (payload) => {
    io.to(payload.receiverId).emit("newMessage", payload);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// ─── DATABASE ─────────────────────────────────────────────────────────────────
connectDB();

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Auth & Users
app.use("/api/auth",      require("./routes/authRoutes"));
app.use("/api/users",     require("./routes/userRoutes"));

// Store & Discovery
app.use("/api/store",     require("./routes/storeRoutes"));
app.use("/api/salons",    require("./routes/storeRoutes"));

// Operations
app.use("/api/queue",     require("./routes/queueRoutes"));
app.use("/api/booking",   require("./routes/bookingRoutes"));
app.use("/api/bookings",  require("./routes/bookingRoutes"));
app.use("/api/checkin",   require("./routes/checkInRoutes"));

// Payments & Marketing
app.use("/api/payment",   require("./routes/paymentRoutes"));
app.use("/api/payments",  require("./routes/paymentRoutes"));
app.use("/api/loyalty",   require("./routes/loyaltyRoutes"));
app.use("/api/promotion", require("./routes/promotionRoutes"));
app.use("/api/complaint", require("./routes/complaintRoutes"));

// Admin & Analytics
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/admin",     require("./routes/adminRoutes"));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({
  message: "TurnUP API running ✅",
  version: "1.2.0",
  status: "Fully Operational",
}));

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
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
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 TurnUP server running on port ${PORT}`);
});