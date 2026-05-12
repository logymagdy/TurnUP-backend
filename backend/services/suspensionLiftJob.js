const Store = require("../models/storeModel");

/**
 * Runs every 5 minutes via setInterval in app.js.
 * Finds all SUSPENDED stores where suspensionEndsAt has passed
 * and automatically reactivates them to ACTIVE.
 * Appends a REACTIVATED entry to moderationLog for audit trail.
 */
const runSuspensionLiftJob = async () => {
  try {
    const now = new Date();

    const expiredSuspensions = await Store.find({
      operationalStatus: "SUSPENDED",
      suspensionEndsAt: { $lte: now },
    });

    for (const store of expiredSuspensions) {
      const previousStatus = store.operationalStatus;

      store.operationalStatus = "ACTIVE";
      store.suspensionEndsAt = null;

      // Append auto-reactivation to moderationLog for full audit trail
      store.moderationLog.push({
        adminId: store.owner, // system action attributed to owner slot
        action: "REACTIVATED",
        reason: "Suspension period ended — auto-reactivated by system.",
        previousStatus,
        newStatus: "ACTIVE",
        suspensionDays: null,
        suspensionEndsAt: null,
        complaintId: null,
        resolution: "Automatic reactivation after suspension duration elapsed.",
      });

      await store.save();

      console.log(
        `✅ Store "${store.storeName}" auto-reactivated after suspension period.`
      );
    }
  } catch (err) {
    console.error("Suspension lift job error:", err.message);
  }
};

module.exports = { runSuspensionLiftJob };