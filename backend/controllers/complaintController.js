const Complaint = require("../models/complaintModel");
const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const { success, error } = require("../responseHandler");
const { sendNotification } = require("../services/notificationServices");

// ─── CLIENT: SUBMIT COMPLAINT ─────────────────────────────────────────────────
exports.submitComplaint = async (req, res) => {
  try {
    const { appointmentId, category, message, images } = req.body;

    if (!appointmentId || !category)
      return res.status(400).json({ message: "appointmentId and category are required." });

    // ── 1. Validate appointment belongs to client and is completed ─────
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized to report this appointment." });

    if (appointment.status !== "DONE")
      return res.status(400).json({
        message: "Complaints can only be submitted for completed appointments.",
      });

    // ── 2. One complaint per appointment ───────────────────────────────
    if (appointment.complaintId)
      return res.status(400).json({
        message: "A complaint has already been submitted for this appointment.",
      });

    // ── 3. Create complaint — storeId auto-linked from appointment ─────
    const complaint = await Complaint.create({
      appointmentId,
      storeId: appointment.storeId,
      client: req.user.id,
      category,
      message: message || null,
      images: images || [],
      status: "SUBMITTED",
    });

    // ── 4. Stamp appointment to block duplicate complaints ─────────────
    appointment.complaintId = complaint._id;
    await appointment.save();

    // ── 5. Notify store owner ──────────────────────────────────────────
    const store = await Store.findById(appointment.storeId).select("owner storeName");
    if (store) {
      await sendNotification(
        store.owner,
        "WARNING_ISSUED",
        `A complaint has been submitted against ${store.storeName}. Please review and respond.`,
        "New Complaint Received",
        complaint._id,
        "APPOINTMENT"
      );
    }

    return success(res, "Complaint submitted successfully.", {
      complaintId: complaint._id,
      status: complaint.status,
      category: complaint.category,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({
        message: "A complaint has already been submitted for this appointment.",
      });
    return error(res, "Failed to submit complaint.", 500);
  }
};

// ─── CLIENT: GET MY COMPLAINTS ────────────────────────────────────────────────
// Returns only client-safe fields — no adminNotes, no internal data
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ client: req.user.id })
      .select("category message images status storeResponse createdAt appointmentId storeId")
      .populate("storeId", "storeName logo")
      .populate("appointmentId", "date time service")
      .sort({ createdAt: -1 });

    return success(res, "Complaints retrieved.", complaints);
  } catch (err) {
    return error(res, "Failed to get complaints.", 500);
  }
};

// ─── STORE: GET STORE COMPLAINTS ──────────────────────────────────────────────
exports.getStoreComplaints = async (req, res) => {
  try {
    if (!req.user.storeId)
      return res.status(403).json({ message: "Not associated with a store." });

    const complaints = await Complaint.find({ storeId: req.user.storeId })
      .select("category message images status storeResponse createdAt appointmentId client")
      .populate("client", "username phone")
      .populate("appointmentId", "date time service")
      .sort({ createdAt: -1 });

    return success(res, "Store complaints retrieved.", complaints);
  } catch (err) {
    return error(res, "Failed to get store complaints.", 500);
  }
};

// ─── STORE: RESPOND TO COMPLAINT ──────────────────────────────────────────────
exports.respondToComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { message, images } = req.body;

    if (!message)
      return res.status(400).json({ message: "Response message is required." });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found." });

    if (String(complaint.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized to respond to this complaint." });

    if (!["SUBMITTED", "IN_REVIEW"].includes(complaint.status))
      return res.status(400).json({
        message: "Cannot respond to a resolved complaint.",
      });

    if (complaint.storeResponse?.respondedAt)
      return res.status(400).json({
        message: "You have already responded to this complaint.",
      });

    complaint.storeResponse = {
      message,
      images: images || [],
      respondedAt: new Date(),
    };
    await complaint.save();

    return success(res, "Response submitted successfully.", {
      complaintId: complaint._id,
      storeResponse: complaint.storeResponse,
    });
  } catch (err) {
    return error(res, "Failed to submit response.", 500);
  }
};

// ─── ADMIN: GET ALL COMPLAINTS ────────────────────────────────────────────────
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, storeId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (storeId) query.storeId = storeId;

    const complaints = await Complaint.find(query)
      .populate("client", "username email phone")
      .populate("storeId", "storeName storeType operationalStatus")
      .populate("appointmentId", "date time service")
      .sort({ createdAt: -1 });

    return success(res, "All complaints retrieved.", complaints);
  } catch (err) {
    return error(res, "Failed to get complaints.", 500);
  }
};

// ─── ADMIN: UPDATE COMPLAINT STATUS ───────────────────────────────────────────
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, adminNotes } = req.body;

    if (!["SUBMITTED", "IN_REVIEW", "RESOLVED"].includes(status))
      return res.status(400).json({ message: "Invalid status." });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found." });

    complaint.status = status;
    if (adminNotes) complaint.adminNotes = adminNotes;
    if (status === "RESOLVED") complaint.resolvedAt = new Date();
    await complaint.save();

    // ── Notify client of status change ─────────────────────────────────
    await sendNotification(
      complaint.client,
      "WARNING_ISSUED",
      `Your complaint status has been updated to: ${status}.`,
      "Complaint Update",
      complaint._id,
      "APPOINTMENT"
    );

    return success(res, "Complaint status updated.", {
      complaintId: complaint._id,
      status: complaint.status,
    });
  } catch (err) {
    return error(res, "Failed to update complaint status.", 500);
  }
};