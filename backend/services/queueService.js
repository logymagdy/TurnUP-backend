const Appointment = require("../models/appointmentModel");

/**
 * Assigns queue number, estimatedStartTime, and expiryTime
 * to a newly created NORMAL booking.
 *
 * @param {string} storeId
 * @param {string} date         - Format: YYYY-MM-DD
 * @param {string} time         - Format: HH:mm
 * @param {number} expiryMinutes - From store settings
 * @returns {{ queueNumber, estimatedStartTime, expiryTime }}
 */
const assignQueueSlot = async (storeId, date, time, expiryMinutes = 20) => {
  // Get all active entries for today sorted by queue number
  const activeEntries = await Appointment.find({
    storeId,
    date,
    status: { $nin: ["CANCELLED", "NO_SHOW", "EXPIRED", "DONE"] },
  }).sort({ queueNumber: 1 });

  // Next queue number
  const lastEntry = activeEntries[activeEntries.length - 1];
  const queueNumber =
    lastEntry && lastEntry.queueNumber ? lastEntry.queueNumber + 1 : 1;

  // Calculate estimated start time based on sum of avg durations ahead
  const totalWaitMinutes = activeEntries.reduce((sum, e) => {
    const avg =
      ((e.service.durationMin || 0) + (e.service.durationMax || 0)) / 2;
    return sum + avg;
  }, 0);

  const appointmentBase = new Date(`${date}T${time}`);
  const estimatedStartTime = new Date(
    appointmentBase.getTime() + totalWaitMinutes * 60 * 1000
  );

  // Expiry = estimatedStartTime + store-defined expiry window
  const expiryTime = new Date(
    estimatedStartTime.getTime() + expiryMinutes * 60 * 1000
  );

  return { queueNumber, estimatedStartTime, expiryTime };
};

module.exports = { assignQueueSlot };