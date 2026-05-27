const express = require("express");
const router = express.Router();
// #swagger.tags = ['Wallet']

const {
  getWallet,
  topUpWallet,
  getAllTransactions,
} = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getWallet);
router.post("/topup", protect, topUpWallet);
router.get("/transactions", protect, getAllTransactions);

module.exports = router;