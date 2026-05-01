const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");

// ─── QR CHECK-IN ──────────────────────────────────────────────────────────────
// Called when client scans the store QR code
// QR contains storeId — system matches it to client's active booking
exports.checkIn = async (req, res) => {
  try {
    const { storeId } = req.body;
    const clientId = req.user.id;

    const today = new Date().toISOString().split("T")[0];

    // Find client's active booking for today at this store
    const appointment = await Appointment.findOne({
      storeId,
      client: clientId,
      date: today,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No active booking found for today at this store.",
      });
    }

    // Prevent double check-in
    if (appointment.checkedIn) {
      return res.status(400).json({
        message: "You have already checked in for this booking.",
      });
    }

    // Validate check-in time window
    // Client must not check in too early (more than 30 mins before their slot)
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const minutesUntilAppointment = (appointmentDateTime - now) / (1000 * 60);

    if (minutesUntilAppointment > 30) {
      return res.status(400).json({
        message: `Too early to check in. Please arrive closer to your appointment time.`,
        minutesUntilAppointment: Math.round(minutesUntilAppointment),
      });
    }

    // Update booking to CHECKED_IN
    appointment.checkedIn = true;
    appointment.checkInTime = now;
    appointment.status = "CHECKED_IN";
    await appointment.save();

    // Notify store owner and receptionist in real time
    const io = req.app.get("io");
    if (io) {
      io.to(`store:${storeId}`).emit("clientCheckedIn", {
        type: "CHECK_IN",
        message: `Client checked in for queue #${appointment.queueNumber}`,
        appointmentId: appointment._id,
        queueNumber: appointment.queueNumber,
        clientId,
        checkInTime: appointment.checkInTime,
      });
    }

    return res.status(200).json({
      message: "Check-in successful.",
      queueNumber: appointment.queueNumber,
      checkInTime: appointment.checkInTime,
      status: appointment.status,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};