const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "TurnUP API",
    description:
      "Smart queue and booking management system for barbershops and beauty salons",
    version: "1.2.0",
  },

  host:
    process.env.NODE_ENV === "production"
      ? "turnup-backend-j5nf.onrender.com"
      : "localhost:3000",

  // ✅ Fixed basePath — all routes prefixed with /api
  basePath: "/api",

  schemes:
    process.env.NODE_ENV === "production" ? ["https"] : ["http"],

  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: 'Enter your JWT token as: Bearer {token}',
    },
  },

  security: [{ bearerAuth: [] }],

  tags: [
    { name: "Auth", description: "Authentication and registration" },
    { name: "Users", description: "User profile management" },
    { name: "Store", description: "Store management and discovery" },
    { name: "Queue", description: "Live queue management" },
    { name: "Booking", description: "Booking creation and management" },
    { name: "Check-In", description: "QR code check-in" },
    { name: "Notifications", description: "Push notifications" },
    { name: "Payments", description: "Payments and transactions" },
    { name: "Loyalty", description: "Loyalty points and rewards" },
    { name: "Wallet", description: "Wallet balance and transactions" },
    { name: "Promotions", description: "Store promotions" },
    { name: "Complaints", description: "Client complaints" },
    { name: "Analytics", description: "Store and admin analytics" },
    { name: "Admin", description: "Admin controls" },
  ],
};

const outputFile = "./swagger-output.json";

const routes = [
  "./routes/authRoutes.js",
  "./routes/userRoutes.js",
  "./routes/storeRoutes.js",
  "./routes/queueRoutes.js",
  "./routes/bookingRoutes.js",
  "./routes/checkInRoutes.js",
  "./routes/notificationRoutes.js",
  "./routes/paymentRoutes.js",
  "./routes/loyaltyRoutes.js",
  "./routes/walletRoutes.js",
  "./routes/promotionRoutes.js",
  "./routes/complaintRoutes.js",
  "./routes/analyticsRoutes.js",
  "./routes/adminRoutes.js",
];

swaggerAutogen(outputFile, routes, doc);