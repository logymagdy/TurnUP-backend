const Appointment = require("../models/appointmentModel");

/**
 * Assigns queue number, estimatedStartTime, and expiryTime
 * to a newly created NORMAL booking.
 */
const assignQueueSlot = async (storeId, date, time, expiryMinutes = 20) => {
  const activeEntries = await Appointment.find({
    storeId,
    date,
    status: { $nin: ["CANCELLED", "NO_SHOW", "EXPIRED", "DONE"] },
  }).sort({ queueNumber: 1 });

  const lastEntry = activeEntries[activeEntries.length - 1];
  const queueNumber =
    lastEntry && lastEntry.queueNumber ? lastEntry.queueNumber + 1 : 1;

  const totalWaitMinutes = activeEntries.reduce((sum, e) => {
    const avg =
      ((e.service.durationMin || 0) + (e.service.durationMax || 0)) / 2;
    return sum + avg;
  }, 0);

  const appointmentBase = new Date(`${date}T${time}`);
  const estimatedStartTime = new Date(
    appointmentBase.getTime() + totalWaitMinutes * 60 * 1000
  );

  const expiryTime = new Date(
    estimatedStartTime.getTime() + expiryMinutes * 60 * 1000
  );

  return { queueNumber, estimatedStartTime, expiryTime };
};

/**
 * Calculates the full live queue state for a store on a given date.
 * Used by queueController, bookingController, and queueExpiryJob
 * to get real-time queue data for emission and API response.
 *
 * @param {string} storeId
 * @param {string} date - Format: YYYY-MM-DD
 * @returns {{ entries, pendingEntries, totalWaitTime, totalWaitMinutes }}
 */
const calculateLiveQueue = async (storeId, date) => {
  const activeStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE"];

  const entries = await Appointment.find({
    storeId,
    date,
    status: { $in: activeStatuses },
  })
    .populate("client", "username phone fcmToken")
    .populate("stylist", "username")
    .sort({ queueNumber: 1 });

  const pendingEntries = entries.filter((e) =>
    ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(e.status)
  );

  // Total wait = sum of avg durations of all pending entries
  const totalWaitMinutes = pendingEntries.reduce((sum, e) => {
    const avg =
      ((e.service?.durationMin || 0) + (e.service?.durationMax || 0)) / 2;
    return sum + avg;
  }, 0);

  const totalWaitTime = Math.ceil(totalWaitMinutes);

  return {
    entries,
    pendingEntries,
    totalWaitTime,
    totalWaitMinutes,
  };
};

module.exports = { assignQueueSlot, calculateLiveQueue };