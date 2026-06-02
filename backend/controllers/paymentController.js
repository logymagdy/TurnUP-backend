const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const Payment = require("../models/paymentModel");
const Store = require("../models/storeModel");
const { calculateCommission } = require("../utils/calculateCommission");
const { sendNotification } = require("../services/notificationServices");

// ─── INITIATE CARD PAYMENT ────────────────────────────────────────────────────
exports.initiatePayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    const client = await User.findById(req.user.id).select("debt wallet");
    const debtAmount = client.debt || 0;
    const totalWithDebt = appointment.totalAmount + debtAmount;

    // TODO: Integrate with Paymob using totalWithDebt
    const paymentKey = "paymob_payment_key_placeholder";

    return res.status(200).json({
      message: "Payment initiated.",
      paymentKey,
      breakdown: {
        serviceAmount: appointment.totalAmount,
        debtAmount,
        totalCharged: totalWithDebt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PAY AT STORE ─────────────────────────────────────────────────────────────
// ✅ Auto-deducts debt from wallet when client pays at store
exports.confirmPayAtStore = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    const client = await User.findById(req.user.id).select(
      "debt wallet username"
    );
    const debtAmount = client.debt || 0;
    const serviceAmount = appointment.totalAmount;
    const totalCharged = serviceAmount + debtAmount;

    // ✅ Clear debt — it will be collected physically at store
    if (debtAmount > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $set: { debt: 0 },
        $inc: { wallet: -debtAmount },
      });

      await sendNotification(
        req.user.id,
        "PENALTY_APPLIED",
        `Your outstanding balance of ${debtAmount} EGP has been added to your payment at the store.`,
        "Debt Cleared",
        appointment._id,
        "APPOINTMENT"
      );
    }

    // ✅ Mark appointment as PAY_AT_STORE confirmed
    appointment.paymentMethod = "PAY_AT_STORE";
    appointment.isPaid = false; // receptionist confirms when cash collected
    await appointment.save();

    // ✅ Create payment record
    const store = await Store.findById(appointment.storeId).select(
      "owner subscriptionStatus"
    );
    const { adminCut, storeCut } = calculateCommission(
      totalCharged,
      store.subscriptionStatus
    );

    await Payment.create({
      client: req.user.id,
      storeId: appointment.storeId,
      appointmentId: appointment._id,
      amount: totalCharged,
      adminCut,
      storeCut,
      type: "SERVICE",
      method: "PAY_AT_STORE",
      status: "PENDING",
      notes: debtAmount > 0
        ? `Service: ${serviceAmount} EGP + Debt: ${debtAmount} EGP`
        : `Service: ${serviceAmount} EGP`,
    });

    return res.status(200).json({
      message: "Payment method confirmed.",
      breakdown: {
        serviceAmount,
        debtAmount,
        totalCharged,
        note: debtAmount > 0
          ? `Includes ${debtAmount} EGP outstanding balance`
          : null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── RECEPTIONIST CONFIRMS CASH COLLECTED ────────────────────────────────────
exports.confirmCashCollected = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized." });

    appointment.isPaid = true;
    await appointment.save();

    await Payment.findOneAndUpdate(
      { appointmentId },
      { status: "COMPLETED" }
    );

    await sendNotification(
      appointment.client,
      "PENALTY_APPLIED",
      `Payment of ${appointment.totalAmount} EGP confirmed at store.`,
      "Payment Confirmed",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Payment confirmed successfully.",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET MY PAYMENTS ──────────────────────────────────────────────────────────
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ client: req.user.id })
      .populate("storeId", "storeName logo")
      .populate("appointmentId", "date time services")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Payments retrieved.",
      payments,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── DIGITAL TIP ──────────────────────────────────────────────────────────────
// ✅ Client sends optional tip to stylist via Instapay after service is DONE
// Tip amounts: 10 / 30 / 50 / 100 EGP only
// Backend records tip and returns stylist's Instapay number
// Client manually sends money via Instapay app
exports.sendTip = async (req, res) => {
  try {
    const { appointmentId, tipAmount } = req.body;

    // ✅ Validate tip amount — only these 4 values allowed
    if (![10, 30, 50, 100].includes(tipAmount))
      return res.status(400).json({
        message: "Tip amount must be 10, 30, 50 or 100 EGP.",
      });

    const appointment = await Appointment.findById(appointmentId).populate(
      "storeId",
      "stylists storeName"
    );

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    // ✅ Only the client who booked can tip
    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    // ✅ Can only tip after service is DONE
    if (appointment.status !== "DONE")
      return res.status(400).json({
        message: "You can only tip after the service is completed.",
      });

    // ✅ Prevent double tipping
    if (appointment.tip && appointment.tip.paid)
      return res.status(400).json({
        message: "You have already sent a tip for this appointment.",
      });

    // ✅ Get stylist's Instapay number from store.stylists subdoc
    const store = appointment.storeId;
    const stylist = store.stylists.id(appointment.stylist);
    const stylistInstapay = stylist?.payoutAccount || null;

    // ✅ Save tip on appointment
    appointment.tip = {
      amount: tipAmount,
      stylistInstapay,
      paid: true,
      paidAt: new Date(),
    };
    await appointment.save();

    // ✅ Create tip payment record
    await Payment.create({
      client: req.user.id,
      storeId: store._id,
      appointmentId: appointment._id,
      amount: tipAmount,
      adminCut: 0,
      storeCut: tipAmount,
      type: "TIP",
      method: "INSTAPAY",
      status: "COMPLETED",
      notes: `Tip for stylist via Instapay: ${stylistInstapay || "not set"}`,
    });

    // ✅ Notify store owner about tip
    await sendNotification(
      store.owner,
      "BOOKING_CONFIRMED",
      `A client tipped ${tipAmount} EGP to a stylist via Instapay.`,
      "New Tip Received",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Tip recorded successfully.",
      tipAmount,
      stylistInstapay,
      note: stylistInstapay
        ? `Please send ${tipAmount} EGP via Instapay to: ${stylistInstapay}`
        : "This stylist has not set up an Instapay account yet.",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PAYMOB WEBHOOK ───────────────────────────────────────────────────────────
exports.paymobWebhook = async (req, res) => {
  try {
    const crypto = require("crypto");
    const data = req.body;

    const hmac = crypto
      .createHmac("sha512", process.env.PAYMOB_HMAC_SECRET)
      .update(JSON.stringify(data.obj))
      .digest("hex");

    if (hmac !== data.hmac)
      return res.status(400).json({ message: "Invalid HMAC." });

    if (data.obj.success === true) {
      const appointmentId = data.obj.order.merchant_order_id;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment)
        return res.status(404).json({ message: "Appointment not found." });

      appointment.isPaid = true;
      appointment.paymentMethod = "CARD";
      await appointment.save();

      // ✅ Clear debt on successful card payment
      const client = await User.findById(appointment.client).select("debt");
      if (client.debt > 0) {
        await User.findByIdAndUpdate(appointment.client, { debt: 0 });
      }

      await Payment.findOneAndUpdate(
        { appointmentId },
        { status: "COMPLETED" }
      );

      await sendNotification(
        appointment.client,
        "PENALTY_APPLIED",
        `Payment confirmed successfully.`,
        "Payment Confirmed",
        appointment._id,
        "APPOINTMENT"
      );
    }

    return res.status(200).json({ message: "Webhook received." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};