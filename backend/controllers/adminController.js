const Store = require("../models/storeModel");
const User = require("../models/userModel");
const { sendNotification } = require("../services/notificationServices");

const ALLOWED_STORE_TYPES = ["barbershop", "beautySalon"];

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
      return res.status(200).json({ message: "Store rejected.", store });
    }

    store.approvalStatus = "APPROVED";
    store.rejectionReason = null;
    store.operationalStatus = "ACTIVE";
    store.subscriptionStatus = "TRIAL";

    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setMonth(trialEnd.getMonth() + 2);
    store.trialStartDate = trialStart;
    store.trialEndDate = trialEnd;
    await store.save();

    return res.status(200).json({ message: "Store approved. 2-month free trial started.", store });
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

exports.moderateStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { action, reason, suspensionDays, complaintId, resolution } = req.body;

    const validActions = ["WARNED", "UNDER_INVESTIGATION", "SUSPENDED", "BANNED", "REACTIVATED"];

    if (!validActions.includes(action))
      return res.status(400).json({ message: `Invalid action. Must be one of: ${validActions.join(", ")}.` });

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
          endsAt.setDate(endsAt.getDate() + 7);
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
      WARNED: `Your store has received a warning (${store.warningCount}/3). Reason: ${reason}`,
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