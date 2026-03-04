require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/store", require("./routes/storeRoutes"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

