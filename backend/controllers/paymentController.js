const crypto = require("crypto");
const axios = require("axios");
const Appointment = require("../models/appointmentModel");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const { sendNotification } = require("../services/notificationServices");

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

// ─── PAYMOB HTTP HELPER (with timeout) ───────────────────────────────────────
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

// ─── STEP 1: INITIATE PAYMENT — returns payment_key for frontend ──────────────
// Frontend uses payment_key to open Paymob iframe or SDK
// CVV, card number, expiry NEVER touch this backend
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

    if (appointment.paymentMethod === "CASH")
      return res.status(400).json({ message: "This appointment is set for cash payment at salon." });

    const amountCents = Math.round(appointment.totalAmount * 100);

    // ── 1. Authenticate with Paymob ───────────────────────────────────
    const authData = await paymobPost(
      "https://accept.paymob.com/api/auth/tokens",
      { api_key: PAYMOB_API_KEY }
    );
    const authToken = authData.token;

    // ── 2. Create Paymob order ─────────────────────────────────────────
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

    // ── 3. Get payment key ─────────────────────────────────────────────
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

    // ── 4. Create pending Payment record — no card data stored ─────────
    await Payment.create({
      client: appointment.client._id,
      storeId: appointment.storeId._id,
      appointmentId: appointment._id,
      amount: appointment.totalAmount,
      type: appointment.deposit > 0 ? "DEPOSIT" : "SERVICE",
      method: "CARD",
      status: "PENDING",
      paymobOrderId,
      referenceId: appointment._id,
      referenceType: "APPOINTMENT",
    });

    // ── 5. Store paymobOrderId on appointment for webhook matching ─────
    appointment.paymentId = paymobOrderId;
    await appointment.save();

    return res.status(200).json({
      message: "Payment initiated. Use payment_key in your frontend SDK.",
      payment_key: paymentKey,
      paymobOrderId,
      amountEGP: appointment.totalAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── STEP 2: PAYMOB WEBHOOK — called by Paymob after card is charged ──────────
// Validates HMAC before trusting any event
// This is the ONLY place isPaid and depositPaid are set to true
exports.paymobWebhook = async (req, res) => {
  try {
    const hmacSecret = PAYMOB_HMAC_SECRET;
    const receivedHmac = req.query.hmac;

    if (!hmacSecret || !receivedHmac) {
      console.error("Webhook: missing HMAC config or header");
      return res.status(400).json({ message: "Invalid webhook." });
    }

    // ── HMAC verification (Paymob concatenation spec) ──────────────────
    const obj = req.body?.obj || {};
    const hmacFields = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id,
      obj.owner,
      obj.pending,
      obj.source_data?.pan,
      obj.source_data?.sub_type,
      obj.source_data?.type,
      obj.success,
    ]
      .map((v) => (v === undefined || v === null ? "" : String(v)))
      .join("");

    const expectedHmac = crypto
      .createHmac("sha512", hmacSecret)
      .update(hmacFields)
      .digest("hex");

    if (receivedHmac !== expectedHmac) {
      console.error("Webhook: HMAC mismatch — possible spoofed request");
      return res.status(401).json({ message: "Unauthorized." });
    }

    // ── Only process successful transactions ───────────────────────────
    if (obj.success !== true) {
      console.log("Webhook: unsuccessful transaction, skipping.");
      return res.status(200).json({ message: "Acknowledged — unsuccessful transaction." });
    }

    const paymobOrderId = String(obj.order?.id);
    const paymobTransactionId = String(obj.id);

    // ── Find and update Payment record ────────────────────────────────
    const payment = await Payment.findOne({ paymobOrderId });
    if (!payment) {
      console.error(`Webhook: No Payment record for paymobOrderId ${paymobOrderId}`);
      return res.status(404).json({ message: "Payment record not found." });
    }

    // Idempotency — skip if already completed
    if (payment.status === "COMPLETED") {
      return res.status(200).json({ message: "Already processed." });
    }

    payment.status = "COMPLETED";
    payment.paymobTransactionId = paymobTransactionId;
    await payment.save();

    // ── Find appointment and confirm payment ──────────────────────────
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.isPaid = true;
      appointment.paymentMethod = "CARD";
      if (appointment.deposit > 0) {
        appointment.depositPaid = true;
      }
      await appointment.save();

      // Notify client — payment confirmed
      await sendNotification(
        appointment.client,
        "BOOKING_CONFIRMED",
        `Payment of ${payment.amount} EGP confirmed for your booking.`,
        "Payment Confirmed",
        appointment._id,
        "APPOINTMENT"
      );
    }

    return res.status(200).json({ message: "Webhook processed successfully." });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    // Always return 200 to Paymob to prevent retries on our own errors
    return res.status(200).json({ message: "Acknowledged." });
  }
};

// ─── CASH PAYMENT — client chooses to pay at salon ───────────────────────────
exports.confirmCashPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.isPaid)
      return res.status(400).json({ message: "Appointment already paid." });

    appointment.paymentMethod = "CASH";
    await appointment.save();

    // Record pending cash payment
    await Payment.create({
      client: appointment.client,
      storeId: appointment.storeId,
      appointmentId: appointment._id,
      amount: appointment.totalAmount,
      type: "SERVICE",
      method: "CASH",
      status: "PENDING",
      referenceId: appointment._id,
      referenceType: "APPOINTMENT",
      notes: "Cash payment — to be collected at salon",
    });

    return res.status(200).json({
      message: "Cash payment selected. Please pay at the salon.",
      appointmentId,
      amountDue: appointment.totalAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── CONFIRM CASH COLLECTED (RECEPTIONIST) ────────────────────────────────────
exports.confirmCashCollected = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    if (String(appointment.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.paymentMethod !== "CASH")
      return res.status(400).json({ message: "This appointment is not a cash payment." });

    if (appointment.isPaid)
      return res.status(400).json({ message: "Already marked as paid." });

    appointment.isPaid = true;
    await appointment.save();

    await Payment.findOneAndUpdate(
      { appointmentId: appointment._id, method: "CASH", status: "PENDING" },
      { status: "COMPLETED" }
    );

    await sendNotification(
      appointment.client,
      "BOOKING_CONFIRMED",
      `Cash payment received for your appointment. Thank you!`,
      "Payment Received",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({ message: "Cash payment confirmed.", appointmentId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET PAYMENT HISTORY (CLIENT) ────────────────────────────────────────────
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