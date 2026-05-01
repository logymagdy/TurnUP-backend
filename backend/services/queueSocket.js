/**
 * Emits real-time queue updates to the store dashboard
 * Called from bookingController, checkInController, and queueController
 * after any status change that affects the live queue
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

module.exports = { emitQueueUpdate };