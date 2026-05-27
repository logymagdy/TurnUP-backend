const User = require("../models/userModel");
const WalletTransaction = require("../models/walletTransactionModel");
const Payment = require("../models/paymentModel");
const { success, error } = require("../utils/responseHandler");

// ─── GET WALLET BALANCE & TRANSACTIONS ───────────────────────────────────────
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("wallet");
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Get recent transactions
    const transactions = await WalletTransaction.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return success(res, "Wallet retrieved", {
      balance: user.wallet,
      transactions,
    });
  } catch (err) {
    return error(res, "Failed to get wallet", 500);
  }
};

// ─── TOP UP WALLET ────────────────────────────────────────────────────────────
exports.topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.wallet += amount;
    await user.save();

    // ✅ Record transaction
    await WalletTransaction.create({
      userId: req.user.id,
      type: "CREDIT",
      amount,
      description: "Wallet Top-up",
      referenceType: "TOPUP",
      balanceAfter: user.wallet,
    });

    return success(res, "Wallet topped up successfully", {
      balance: user.wallet,
      credited: amount,
    });
  } catch (err) {
    return error(res, "Failed to top up wallet", 500);
  }
};

// ─── GET ALL TRANSACTIONS ─────────────────────────────────────────────────────
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 });

    return success(res, "Transactions retrieved", transactions);
  } catch (err) {
    return error(res, "Failed to get transactions", 500);
  }
};