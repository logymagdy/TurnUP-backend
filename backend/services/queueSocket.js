/**
 * ─── REAL-TIME QUEUE SOCKET LAYER ────────────────────────────────────────────
 * All socket emissions for queue and wait time updates live here.
 * Called from bookingController, checkInController, and queueController
 * after any status change that affects the live queue.
 */

/**
 * Emits a queue change event to the store dashboard room
 *
 * @param {object} io       - Socket.io instance
 * @param {string} storeId  - Store room to emit to
 * @param {string} event    - Socket event name
 * @param {object} payload  - Data to send
 */
const emitQueueUpdate = (io, storeId, event, payload) => {
  if (!io || !storeId) return;
  io.to(`store:${storeId}`).emit(event, payload);
};

/**
 * Emits a full queue state refresh including recalculated wait times.
 * Called after any booking status change that shifts queue positions.
 *
 * @param {object} io
 * @param {string} storeId
 * @param {object} queueData - Output from calculateLiveQueue()
 */
const emitFullQueueRefresh = (io, storeId, queueData) => {
  if (!io || !storeId) return;
  io.to(`store:${storeId}`).emit("queueUpdated", {
    type: "QUEUE_REFRESHED",
    totalWaitTime: queueData.totalWaitTime,
    totalInQueue: queueData.pendingEntries.length,
    entries: queueData.entries,
  });

  // Also emit dedicated wait time update event for frontend timers
  io.to(`store:${storeId}`).emit("waitTimeUpdated", {
    type: "WAIT_TIME_UPDATED",
    totalWaitTime: queueData.totalWaitTime,
    totalWaitMinutes: queueData.totalWaitMinutes,
  });
};

module.exports = { emitQueueUpdate, emitFullQueueRefresh };