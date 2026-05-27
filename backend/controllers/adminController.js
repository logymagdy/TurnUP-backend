const Store = require("../models/storeModel");
const User = require("../models/userModel");
const Payment = require("../models/paymentModel");
const Appointment = require("../models/appointmentModel");
const Complaint = require("../models/complaintModel");
const mongoose = require("mongoose");
const { sendNotification } = require("../services/notificationServices");

const ALLOWED_STORE_TYPES = ["barbershop", "beautySalon"];
const SUBSCRIPTION_AMOUNT = 1500;
const GRACE_PERIOD_DAYS = 14;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const validateStoreForApproval = (store) => {
  const errors = [];
  if (!store.storeName || store.storeName.trim() === "")
    errors.push("Store name is missing.");
  if (!store.storeType || !ALLOWED_STORE_TYPES.includes(store.storeType))
    errors.push(`Store type is invalid or missing. Allowed: ${ALLOWED_STORE_TYPES.join(", ")}.`);
  if (!store.phone || store.phone.trim() === "")
    errors.push("Store phone number is missing.");
  if (!store.location || store.location.trim() === "")
    errors.push("Store location is missing.");
  if (!store.approvalDocuments?.businessLicense)
    errors.push("Required document missing: businessLicense.");
  if (!store.approvalDocuments?.ownerIdPhoto)
    errors.push("Required document missing: ownerIdPhoto.");
  if (
    !store.approvalDocuments?.shopPhotos ||
    !Array.isArray(store.approvalDocuments.shopPhotos) ||
    store.approvalDocuments.shopPhotos.length < 3
  )
    errors.push("Shop photos must include at least 3 images.");
  return errors;
};

// ─── STORE APPROVAL ───────────────────────────────────────────────────────────
exports.approveStore = async (req, res) => {
  try {
    const { storeId, action, reason } = req.body;

    if (!["APPROVED", "REJECTED"].includes(action))
      return res.status(400).json({ message: "Invalid action. Must be APPROVED or REJECTED." });

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found." });

    if (store.approvalStatus !== "PENDING")
      return res.status(400).json({
        message: `Store is already ${store.approvalStatus}. Only PENDING stores can be reviewed.`,
      });

    const duplicate = await Store.findOne({
      _id: { $ne: storeId },
      owner: store.owner,
      storeName: store.storeName,
      storeType: store.storeType,
      approvalStatus: "APPROVED",
    });

    if (duplicate)
      return res.status(400).json({
        message: "A store with the same name and type already exists for this owner.",
      });

    const validationErrors = validateStoreForApproval(store);
    if (validationErrors.length > 0)
      return res.status(400).json({ message: "Store failed validation:", errors: validationErrors });

    if (action === "REJECTED") {
      if (!reason || reason.trim() === "")
        return res.status(400).json({ message: "A rejection reason is required." });

      store.approvalStatus = "REJECTED";
      store.rejectionReason = reason.trim();
      await store.save();

      await sendNotification(
        store.owner,
        "STORE_SUSPENDED",
        `Your store registration was rejected. Reason: ${reason}. Please fix the issues and reapply.`,
        "Store Registration Rejected",
        store._id,
        "STORE"
      );

      return res.status(200).json({ message: "Store rejected.", store });
    }

    // ── APPROVED ──────────────────────────────────────────────────────
    store.approvalStatus = "APPROVED";
    store.rejectionReason = null;
    store.operationalStatus = "ACTIVE";
    store.subscriptionStatus = "TRIAL";

    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setMonth(trialEnd.getMonth() + 2);
    store.trialStartDate = trialStart;
    store.trialEndDate = trialEnd;
    store.nextPaymentDate = new Date(trialEnd);

    await store.save();

    await sendNotification(
      store.owner,
      "BOOKING_CONFIRMED",
      `Congratulations! Your store has been approved. Your 2-month free trial starts today and ends on ${trialEnd.toDateString()}.`,
      "Store Approved",
      store._id,
      "STORE"
    );

    return res.status(200).json({
      message: "Store approved. 2-month free trial started.",
      store,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getPendingStores = async (req, res) => {
  try {
    const stores = await Store.find({ approvalStatus: "PENDING" })
      .populate("owner", "username email phone")
      .select("storeName storeType location phone approvalDocuments createdAt")
      .sort({ createdAt: 1 });
    return res.status(200).json({ count: stores.length, stores });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── STORE MODERATION ─────────────────────────────────────────────────────────
exports.moderateStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { action, reason, suspensionDays, complaintId, resolution } = req.body;

    const validActions = ["WARNED", "UNDER_INVESTIGATION", "SUSPENDED", "BANNED", "REACTIVATED"];

    if (!validActions.includes(action))
      return res.status(400).json({
        message: `Invalid action. Must be one of: ${validActions.join(", ")}.`,
      });

    if (!reason || reason.trim() === "")
      return res.status(400).json({ message: "A reason is required for all moderation actions." });

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found." });

    if (store.approvalStatus !== "APPROVED")
      return res.status(400).json({ message: "Only approved stores can be moderated." });

    const previousStatus = store.operationalStatus;
    let newStatus = previousStatus;
    let suspensionEndsAt = null;

    switch (action) {
      case "WARNED":
        store.warningCount += 1;
        if (store.warningCount >= 3) {
          newStatus = "SUSPENDED";
          store.operationalStatus = "SUSPENDED";
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + GRACE_PERIOD_DAYS);
          store.suspensionEndsAt = endsAt;
          suspensionEndsAt = endsAt;
        }
        break;

      case "UNDER_INVESTIGATION":
        newStatus = "UNDER_INVESTIGATION";
        store.operationalStatus = "UNDER_INVESTIGATION";
        break;

      case "SUSPENDED":
        if (!suspensionDays || suspensionDays < 1)
          return res.status(400).json({ message: "suspensionDays required for SUSPENDED action." });
        newStatus = "SUSPENDED";
        store.operationalStatus = "SUSPENDED";
        suspensionEndsAt = new Date();
        suspensionEndsAt.setDate(suspensionEndsAt.getDate() + suspensionDays);
        store.suspensionEndsAt = suspensionEndsAt;
        break;

      case "BANNED":
        newStatus = "BANNED";
        store.operationalStatus = "BANNED";
        store.suspensionEndsAt = null;
        break;

      case "REACTIVATED":
        if (previousStatus === "BANNED")
          return res.status(400).json({ message: "BANNED stores cannot be reactivated." });
        newStatus = "ACTIVE";
        store.operationalStatus = "ACTIVE";
        store.suspensionEndsAt = null;
        break;
    }

    store.moderationLog.push({
      adminId: req.user.id,
      action,
      reason: reason.trim(),
      previousStatus,
      newStatus,
      suspensionDays: suspensionDays || null,
      suspensionEndsAt,
      complaintId: complaintId || null,
      resolution: resolution || null,
    });

    await store.save();

    const messageMap = {
      WARNED: `Your store has received a warning (${store.warningCount}/3). Reason: ${reason}${store.warningCount >= 3 ? ` — Your store has been suspended for ${GRACE_PERIOD_DAYS} days.` : ""}`,
      UNDER_INVESTIGATION: `Your store is under investigation. Reason: ${reason}`,
      SUSPENDED: `Your store has been suspended for ${suspensionDays} day(s). Reason: ${reason}`,
      BANNED: `Your store has been permanently banned. Reason: ${reason}`,
      REACTIVATED: `Your store has been reactivated and is now live.`,
    };

    await sendNotification(
      store.owner,
      "STORE_SUSPENDED",
      messageMap[action],
      "Store Moderation Action",
      store._id,
      "STORE"
    );

    return res.status(200).json({
      message: `Moderation action applied: ${action}`,
      operationalStatus: store.operationalStatus,
      warningCount: store.warningCount,
      suspensionEndsAt: store.suspensionEndsAt,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getModerationLog = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId)
      .select("storeName operationalStatus warningCount moderationLog")
      .populate("moderationLog.adminId", "username email")
      .populate("moderationLog.complaintId", "category status");

    if (!store) return res.status(404).json({ message: "Store not found." });

    return res.status(200).json({
      storeName: store.storeName,
      operationalStatus: store.operationalStatus,
      warningCount: store.warningCount,
      moderationLog: store.moderationLog,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── SUBSCRIPTION MANAGEMENT ──────────────────────────────────────────────────
exports.getSubscriptionOverview = async (req, res) => {
  try {
    const now = new Date();

    const [trial, active, expired, suspended] = await Promise.all([
      Store.countDocuments({ approvalStatus: "APPROVED", subscriptionStatus: "TRIAL" }),
      Store.countDocuments({ approvalStatus: "APPROVED", subscriptionStatus: "ACTIVE" }),
      Store.countDocuments({ approvalStatus: "APPROVED", subscriptionStatus: "EXPIRED" }),
      Store.countDocuments({ approvalStatus: "APPROVED", operationalStatus: "SUSPENDED" }),
    ]);

    const trialEndingSoon = await Store.find({
      approvalStatus: "APPROVED",
      subscriptionStatus: "TRIAL",
      trialEndDate: {
        $gte: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    })
      .select("storeName owner trialEndDate")
      .populate("owner", "username email");

    const inGracePeriod = await Store.find({
      approvalStatus: "APPROVED",
      subscriptionStatus: "EXPIRED",
      gracePeriodEndsAt: { $gte: now },
    })
      .select("storeName owner gracePeriodEndsAt nextPaymentDate")
      .populate("owner", "username email");

    const totalSubscriptionRevenue = await Payment.aggregate([
      { $match: { type: "SUBSCRIPTION", status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return res.status(200).json({
      summary: { trial, active, expired, suspended },
      trialEndingSoon,
      inGracePeriod,
      totalSubscriptionRevenue: totalSubscriptionRevenue[0]?.total || 0,
      subscriptionAmount: SUBSCRIPTION_AMOUNT,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.manuallyChargeSubscription = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId).populate("owner", "username email");
    if (!store) return res.status(404).json({ message: "Store not found." });

    if (store.subscriptionStatus === "TRIAL")
      return res.status(400).json({ message: "Store is still in trial period." });

    await Payment.create({
      storeId: store._id,
      amount: SUBSCRIPTION_AMOUNT,
      adminCut: SUBSCRIPTION_AMOUNT,
      storeCut: 0,
      type: "SUBSCRIPTION",
      method: "CARD",
      status: "COMPLETED",
      notes: `Manual subscription charge by ADMIN for ${store.storeName}`,
    });

    store.subscriptionStatus = "ACTIVE";
    store.lastPaymentDate = new Date();
    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    store.nextPaymentDate = nextPayment;
    store.gracePeriodEndsAt = null;

    if (store.operationalStatus === "SUSPENDED") {
      store.operationalStatus = "ACTIVE";
      store.suspensionEndsAt = null;
    }

    await store.save();

    await sendNotification(
      store.owner,
      "SUBSCRIPTION_DUE",
      `Your subscription payment of ${SUBSCRIPTION_AMOUNT} EGP has been processed. Your store is now active.`,
      "Subscription Payment Processed",
      store._id,
      "STORE"
    );

    return res.status(200).json({
      message: "Subscription charged successfully. Store reactivated.",
      nextPaymentDate: store.nextPaymentDate,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── ADMIN ANALYTICS DASHBOARD ────────────────────────────────────────────────
exports.getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalStores, pendingStores, activeStores, suspendedStores,
      bannedStores, newStoresThisMonth, newStoresLastMonth,
    ] = await Promise.all([
      Store.countDocuments({ approvalStatus: "APPROVED" }),
      Store.countDocuments({ approvalStatus: "PENDING" }),
      Store.countDocuments({ approvalStatus: "APPROVED", operationalStatus: "ACTIVE" }),
      Store.countDocuments({ approvalStatus: "APPROVED", operationalStatus: "SUSPENDED" }),
      Store.countDocuments({ approvalStatus: "APPROVED", operationalStatus: "BANNED" }),
      Store.countDocuments({ approvalStatus: "APPROVED", createdAt: { $gte: startOfMonth } }),
      Store.countDocuments({ approvalStatus: "APPROVED", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    ]);

    const [
      totalClients, totalProviders, newUsersThisMonth, newUsersLastMonth,
    ] = await Promise.all([
      User.countDocuments({ role: "CLIENT" }),
      User.countDocuments({ role: "serviceProvider" }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    ]);

    const [
      totalRevenueResult, adminCommissionResult,
      subscriptionRevenueResult, revenueThisMonth, revenueLastMonth,
    ] = await Promise.all([
      Payment.aggregate([{ $match: { status: "COMPLETED", type: { $ne: "REFUND" } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.aggregate([{ $match: { status: "COMPLETED", type: "SERVICE" } }, { $group: { _id: null, total: { $sum: "$adminCut" } } }]),
      Payment.aggregate([{ $match: { status: "COMPLETED", type: "SUBSCRIPTION" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.aggregate([{ $match: { status: "COMPLETED", type: { $ne: "REFUND" }, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.aggregate([{ $match: { status: "COMPLETED", type: { $ne: "REFUND" }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);

    const [
      totalComplaints, pendingComplaints, inReviewComplaints, resolvedComplaints,
    ] = await Promise.all([
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: "SUBMITTED" }),
      Complaint.countDocuments({ status: "IN_REVIEW" }),
      Complaint.countDocuments({ status: "RESOLVED" }),
    ]);

    const [totalBookings, completedBookings, noShowBookings, cancelledBookings] = await Promise.all([
      Appointment.countDocuments({}),
      Appointment.countDocuments({ status: "DONE" }),
      Appointment.countDocuments({ status: "NO_SHOW" }),
      Appointment.countDocuments({ status: "CANCELLED" }),
    ]);

    const storeGrowth = newStoresLastMonth > 0
      ? Math.round(((newStoresThisMonth - newStoresLastMonth) / newStoresLastMonth) * 100)
      : 100;

    const userGrowth = newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : 100;

    const revenueThisMonthVal = revenueThisMonth[0]?.total || 0;
    const revenueLastMonthVal = revenueLastMonth[0]?.total || 0;
    const revenueGrowth = revenueLastMonthVal > 0
      ? Math.round(((revenueThisMonthVal - revenueLastMonthVal) / revenueLastMonthVal) * 100)
      : 100;

    const suspendedStoresList = await Store.find({
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["SUSPENDED", "BANNED"] },
    })
      .select("storeName storeType operationalStatus warningCount suspensionEndsAt")
      .populate("owner", "username email phone")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      stores: {
        total: totalStores,
        pending: pendingStores,
        active: activeStores,
        suspended: suspendedStores,
        banned: bannedStores,
        newThisMonth: newStoresThisMonth,
        growthPercent: storeGrowth,
      },
      users: {
        totalClients,
        totalProviders,
        newThisMonth: newUsersThisMonth,
        growthPercent: userGrowth,
      },
      revenue: {
        totalAllTime: totalRevenueResult[0]?.total || 0,
        thisMonth: revenueThisMonthVal,
        lastMonth: revenueLastMonthVal,
        growthPercent: revenueGrowth,
        adminCommission: adminCommissionResult[0]?.total || 0,
        subscriptionRevenue: subscriptionRevenueResult[0]?.total || 0,
      },
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        inReview: inReviewComplaints,
        resolved: resolvedComplaints,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        noShow: noShowBookings,
        cancelled: cancelledBookings,
      },
      suspendedStoresList,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};