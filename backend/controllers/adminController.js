const Store = require("../models/storeModel");

// ─── Helpers ────────────────────────────────────────────────────────────────

const ALLOWED_STORE_TYPES = ["barbershop", "beautySalon"];

/**
 * Validates that the store has all required fields and documents
 * before an admin can approve it.
 * Returns an array of validation error strings (empty = valid).
 */
const validateStoreForApproval = (store) => {
  const errors = [];

  // ── Basic info checks ──────────────────────────────────────────────────
  if (!store.storeName || store.storeName.trim() === "") {
    errors.push("Store name is missing.");
  }

  if (!store.storeType || !ALLOWED_STORE_TYPES.includes(store.storeType)) {
    errors.push(
      `Store type is invalid or missing. Allowed types: ${ALLOWED_STORE_TYPES.join(", ")}.`
    );
  }

  if (!store.phone || store.phone.trim() === "") {
    errors.push("Store phone number is missing.");
  }

  if (!store.location || store.location.trim() === "") {
    errors.push("Store location is missing.");
  }

  // ── Document checks ────────────────────────────────────────────────────
  if (!store.approvalDocuments?.businessLicense) {
    errors.push("Required document is missing: businessLicense.");
  }

  if (!store.approvalDocuments?.ownerIdPhoto) {
    errors.push("Required document is missing: ownerIdPhoto.");
  }

  if (
    !store.approvalDocuments?.shopPhotos ||
    !Array.isArray(store.approvalDocuments.shopPhotos) ||
    store.approvalDocuments.shopPhotos.length < 3
  ) {
    errors.push("Shop photos must include at least 3 images.");
  }

  return errors;
};

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * ADMIN — Approve or Reject a store registration
 *
 * Body:
 *   storeId  {string} — ID of the store to review
 *   action   {string} — "APPROVED" or "REJECTED"
 *   reason   {string} — Required when action is "REJECTED"
 *
 * Access: ADMIN only (enforced by authMiddleware)
 */
exports.approveStore = async (req, res) => {
  try {
    const { storeId, action, reason } = req.body;

    // ── 1. Validate action value ───────────────────────────────────────
    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({
        message: "Invalid action. Must be 'APPROVED' or 'REJECTED'.",
      });
    }

    // ── 2. Find store ──────────────────────────────────────────────────
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }

    // ── 3. Ensure store is still PENDING ───────────────────────────────
    if (store.approvalStatus !== "PENDING") {
      return res.status(400).json({
        message: `Store is already ${store.approvalStatus}. Only PENDING stores can be reviewed.`,
      });
    }

    // ── 4. Check for duplicate store (same owner, same name + type) ────
    const duplicate = await Store.findOne({
      _id: { $ne: storeId },
      owner: store.owner,
      storeName: store.storeName,
      storeType: store.storeType,
      approvalStatus: { $in: ["APPROVED", "ACTIVE"] },
    });

    if (duplicate) {
      return res.status(400).json({
        message:
          "A store with the same name and type already exists for this owner. Cannot approve duplicate.",
      });
    }

    // ── 5. Run document & data validation before approving ────────────
    const validationErrors = validateStoreForApproval(store);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message:
          "Store cannot be approved — it failed the following validation checks:",
        errors: validationErrors,
      });
    }

    // ── 6. Handle REJECTED ─────────────────────────────────────────────
    if (action === "REJECTED") {
      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          message: "A rejection reason is required when rejecting a store.",
        });
      }

      store.approvalStatus = "REJECTED";
      store.rejectionReason = reason.trim();
      await store.save();

      return res.status(200).json({
        message: "Store has been rejected.",
        store,
      });
    }

    // ── 7. Handle APPROVED ─────────────────────────────────────────────
    store.approvalStatus = "APPROVED";
    store.rejectionReason = null;

    // 2-month free trial starts from the approval date
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setMonth(trialEnd.getMonth() + 2);

    store.trialStartDate = trialStart;
    store.trialEndDate = trialEnd;

    await store.save();

    return res.status(200).json({
      message: "Store has been approved. 2-month free trial started.",
      store,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};