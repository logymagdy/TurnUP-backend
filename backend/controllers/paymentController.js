const crypto = require("crypto");
const axios = require("axios");
const Appointment = require("../models/appointmentModel");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const WalletTransaction = require("../models/walletTransactionModel");
const { sendNotification } = require("../services/notificationServices");
const { calculateCommission } = require("../utils/calculateCommission");

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

const paymobPost = async (url, data) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await axios.post(url, data, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    return response.data;
  } catch (err) {
    if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
      throw new Error("Paymob request timed out. Please try again.");
    }
    throw new Error(err.response?.data?.message || err.message);
  } finally {
    clearTimeout(timeout);
  }
};

// ─── INITIATE CARD PAYMENT ────────────────────────────────────────────────────
exports.initiatePayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId)
      return res.status(400).json({ message: "appointmentId is required." });

    const appointment = await Appointment.findById(appointmentId)
      .populate("client", "username email phone")
      .populate("storeId", "storeName");

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.client._id) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.isPaid)
      return res.status(400).json({ message: "Appointment already paid." });

    if (appointment.paymentMethod === "PAY_AT_STORE")
      return res.status(400).json({
        message: "This appointment is set for payment at store.",
      });

    const amountCents = Math.round(appointment.totalAmount * 100);

    const authData = await paymobPost(
      "https://accept.paymob.com/api/auth/tokens",
      { api_key: PAYMOB_API_KEY }
    );
    const authToken = authData.token;

    const orderData = await paymobPost(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: String(appointment._id),
        items: appointment.services.map((s) => ({
          name: s.name,
          amount_cents: Math.round(s.price * 100),
          description: s.name,
          quantity: 1,
        })),
      }
    );
    const paymobOrderId = String(orderData.id);

    const client = appointment.client;
    const paymentKeyData = await paymobPost(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          apartment: "NA",
          email: client.email || "NA",
          floor: "NA",
          first_name: client.username || "Client",
          last_name: ".",
          street: "NA",
          building: "NA",
          phone_number: client.phone || "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          state: "Cairo",
        },
        currency: "EGP",
        integration_id: PAYMOB_INTEGRATION_ID,
        lock_order_when_paid: true,
      }
    );
    const paymentKey = paymentKeyData.token;

    // ✅ Calculate commission before creating payment record
    const user = await User.findById(req.user.id).select("visitCount");
    const { adminCut, storeCut } = calculateCommission(
      appointment.totalAmount,
      user.visitCount || 0
    );

    await Payment.create({
      client: appointment.client._id,
      storeId: appointment.storeId._id,
      appointmentId: appointment._id,
      amount: appointment.totalAmount,
      adminCut,
      storeCut,
      type: appointment.deposit > 0 ? "DEPOSIT" : "SERVICE",
      method: "CARD",
      status: "PENDING",
      paymobOrderId,
      referenceId: appointment._id,
      referenceType: "APPOINTMENT",
    });

    appointment.paymentId = paymobOrderId;
    await appointment.save();

    return res.status(200).json({
      message: "Payment initiated.",
      payment_key: paymentKey,
      paymobOrderId,
      amountEGP: appointment.totalAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PAYMOB WEBHOOK ───────────────────────────────────────────────────────────
exports.paymobWebhook = async (req, res) => {
  try {
    const hmacSecret = PAYMOB_HMAC_SECRET;
    const receivedHmac = req.query.hmac;

    if (!hmacSecret || !receivedHmac) {
      return res.status(400).json({ message: "Invalid webhook." });
    }

    const obj = req.body?.obj || {};
    const hmacFields = [
      obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
      obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
      obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
      obj.is_voided, obj.order?.id, obj.owner, obj.pending,
      obj.source_data?.pan, obj.source_data?.sub_type, obj.source_data?.type,
      obj.success,
    ]
      .map((v) => (v === undefined || v === null ? "" : String(v)))
      .join("");

    const expectedHmac = crypto
      .createHmac("sha512", hmacSecret)
      .update(hmacFields)
      .digest("hex");

    if (receivedHmac !== expectedHmac) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (obj.success !== true) {
      return res.status(200).json({ message: "Acknowledged — unsuccessful." });
    }

    const paymobOrderId = String(obj.order?.id);
    const paymobTransactionId = String(obj.id);

    const payment = await Payment.findOne({ paymobOrderId });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found." });
    }

    if (payment.status === "COMPLETED") {
      return res.status(200).json({ message: "Already processed." });
    }

    payment.status = "COMPLETED";
    payment.paymobTransactionId = paymobTransactionId;
    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.isPaid = true;
      appointment.paymentMethod = "CARD";
      if (appointment.deposit > 0) appointment.depositPaid = true;
      await appointment.save();

      // ✅ Increment visit count for commission calculation
      await User.findByIdAndUpdate(appointment.client, {
        $inc: { visitCount: 1 },
      });

      // ✅ Record wallet transaction for refund tracking
      await WalletTransaction.create({
        userId: appointment.client,
        type: "DEBIT",
        amount: payment.amount,
        description: `Payment for appointment`,
        referenceId: appointment._id,
        referenceType: "APPOINTMENT",
        balanceAfter: 0, // will be recalculated if needed
      });

      await sendNotification(
        appointment.client,
        "BOOKING_CONFIRMED",
        `Payment of ${payment.amount} EGP confirmed.`,
        "Payment Confirmed",
        appointment._id,
        "APPOINTMENT"
      );
    }

    return res.status(200).json({ message: "Webhook processed." });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(200).json({ message: "Acknowledged." });
  }
};

// ─── PAY AT STORE ─────────────────────────────────────────────────────────────
// ✅ Renamed from confirmCashPayment to payAtStore
exports.payAtStore = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.isPaid)
      return res.status(400).json({ message: "Already paid." });

    appointment.paymentMethod = "PAY_AT_STORE";
    await appointment.save();

    const user = await User.findById(req.user.id).select("visitCount");
    const { adminCut, storeCut } = calculateCommission(
      appointment.totalAmount,
      user.visitCount || 0
    );

    await Payment.create({
      client: appointment.client,
      storeId: appointment.storeId,
      appointmentId: appointment._id,
      amount: appointment.totalAmount,
      adminCut,
      storeCut,
      type: "SERVICE",
      method: "PAY_AT_STORE",
      status: "PENDING",
      referenceId: appointment._id,
      referenceType: "APPOINTMENT",
      notes: "Client will pay at store",
    });

    return res.status(200).json({
      message: "Payment method set to Pay at Store.",
      appointmentId,
      amountDue: appointment.totalAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── CONFIRM PAY AT STORE COLLECTED (RECEPTIONIST) ────────────────────────────
exports.confirmPayAtStoreCollected = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.paymentMethod !== "PAY_AT_STORE")
      return res.status(400).json({ message: "Not a pay-at-store appointment." });

    if (appointment.isPaid)
      return res.status(400).json({ message: "Already marked as paid." });

    appointment.isPaid = true;
    await appointment.save();

    await Payment.findOneAndUpdate(
      {
        appointmentId: appointment._id,
        method: "PAY_AT_STORE",
        status: "PENDING",
      },
      { status: "COMPLETED" }
    );

    // ✅ Increment visit count
    await User.findByIdAndUpdate(appointment.client, {
      $inc: { visitCount: 1 },
    });

    await sendNotification(
      appointment.client,
      "BOOKING_CONFIRMED",
      `Payment received at store. Thank you!`,
      "Payment Received",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Payment at store confirmed.",
      appointmentId,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET MY PAYMENTS ──────────────────────────────────────────────────────────
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ client: req.user.id })
      .populate("storeId", "storeName")
      .populate("appointmentId", "date time service")
      .sort({ createdAt: -1 });

    return res.status(200).json({ payments });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};