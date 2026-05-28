const mongoose = require("mongoose");
const Payment = require("../models/paymentModel");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");
const Store = require("../models/storeModel");

// ─── STORE ANALYTICS (deep stats for analytics screen) ───────────────────────
exports.getStoreAnalytics = async (req, res) => {
  try {
    const storeId = new mongoose.Types.ObjectId(String(req.user.storeId));
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRevenueResult = await Payment.aggregate([
      { $match: { storeId, status: "COMPLETED", type: "SERVICE" } },
      { $group: { _id: null, total: { $sum: "$storeCut" } } },
    ]);

    const dailyRevenueResult = await Payment.aggregate([
      { $match: { storeId, status: "COMPLETED", type: "SERVICE", createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$storeCut" } } },
    ]);

    const monthlyRevenueResult = await Payment.aggregate([
      { $match: { storeId, status: "COMPLETED", type: "SERVICE", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$storeCut" } } },
    ]);

    const commissionDeducted = await Payment.aggregate([
      { $match: { storeId, status: "COMPLETED", type: "SERVICE" } },
      { $group: { _id: null, total: { $sum: "$adminCut" } } },
    ]);

    const bookingStats = await Appointment.aggregate([
      { $match: { storeId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statsMap = {};
    bookingStats.forEach((s) => { statsMap[s._id] = s.count; });

    const totalBookings = Object.values(statsMap).reduce((a, b) => a + b, 0);
    const completedBookings = statsMap["DONE"] || 0;
    const noShowBookings = statsMap["NO_SHOW"] || 0;
    const cancelledBookings = statsMap["CANCELLED"] || 0;
    const noShowRate = totalBookings > 0
      ? Math.round((noShowBookings / totalBookings) * 100)
      : 0;

    // ✅ Use isWalkIn field — bookingType NORMAL ≠ walk-in
    const [walkInCount, onlineCount] = await Promise.all([
      Appointment.countDocuments({ storeId, isWalkIn: true }),
      Appointment.countDocuments({ storeId, isWalkIn: false }),
    ]);

    const walkInPercentage = totalBookings > 0
      ? Math.round((walkInCount / totalBookings) * 100)
      : 0;
    const onlinePercentage = totalBookings > 0
      ? Math.round((onlineCount / totalBookings) * 100)
      : 0;

    const peakHours = await Appointment.aggregate([
      { $match: { storeId } },
      {
        $addFields: {
          hour: {
            $hour: {
              $dateFromString: {
                dateString: { $concat: ["$date", "T", "$time", ":00"] },
              },
            },
          },
        },
      },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { hour: "$_id", count: 1, _id: 0 } },
    ]);

    const topServices = await Appointment.aggregate([
      { $match: { storeId } },
      { $group: { _id: "$service.name", count: { $sum: 1 }, revenue: { $sum: "$service.price" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", count: 1, revenue: 1, _id: 0 } },
    ]);

    // ✅ Stylists are subdocs inside store — match by stylist ObjectId against store.stylists[]
    const store = await Store.findById(storeId).select("stylists");
    const stylistStats = await Appointment.aggregate([
      { $match: { storeId, status: "DONE" } },
      {
        $group: {
          _id: "$stylist",
          completedServices: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          totalRevenue: { $sum: "$service.price" },
        },
      },
      { $sort: { completedServices: -1 } },
    ]);

    const stylistPerformance = stylistStats.map((s) => {
      const match = store?.stylists?.find(
        (st) => String(st._id) === String(s._id)
      );
      return {
        stylistId: s._id,
        stylistName: match?.fullName || "Unknown",
        photo: match?.photo || null,
        role: match?.role || null,
        completedServices: s.completedServices,
        avgRating: s.avgRating ? Math.round(s.avgRating * 10) / 10 : null,
        totalRevenue: s.totalRevenue,
      };
    });

    return res.status(200).json({
      revenue: {
        total: totalRevenueResult[0]?.total || 0,
        today: dailyRevenueResult[0]?.total || 0,
        thisMonth: monthlyRevenueResult[0]?.total || 0,
        commissionDeducted: commissionDeducted[0]?.total || 0,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        noShow: noShowBookings,
        cancelled: cancelledBookings,
        noShowRate,
      },
      bookingTypeSplit: {
        walkIn: walkInCount,
        online: onlineCount,
        walkInPercentage,
        onlinePercentage,
      },
      peakHours,
      topServices,
      stylistPerformance,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── BUSINESS DASHBOARD ───────────────────────────────────────────────────────
// Powers the main dashboard screen:
//   • Store name header
//   • 3 stat cards: today's appointments, clients served today, staff on duty
//   • Weekly bar chart (appointments per day Sun–Sat of current week)
//   • Specialists row (store stylists with photo + active status)
//   • Day schedule (today's appointments — client name + service)
//   • Top performer (stylist with most completed services this week + revenue)
exports.getBusinessDashboard = async (req, res) => {
  try {
    const storeId = new mongoose.Types.ObjectId(String(req.user.storeId));
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // ── Date helpers ──────────────────────────────────────────────────────────
    // Start of current week (Sunday)
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // ── 1. Store info ─────────────────────────────────────────────────────────
    const store = await Store.findById(storeId).select(
      "storeName stylists isOpen isPaused"
    );
    if (!store) return res.status(404).json({ message: "Store not found." });

    // ── 2. Today's stat cards ─────────────────────────────────────────────────
    const [todayAppointments, clientsServedToday] = await Promise.all([
      // Total appointments scheduled for today (all active statuses)
      Appointment.countDocuments({
        storeId,
        date: todayStr,
        status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE", "DONE"] },
      }),
      // Clients whose service is completed today
      Appointment.countDocuments({
        storeId,
        date: todayStr,
        status: "DONE",
      }),
    ]);

    // Staff on duty = total stylists in store (not per-shift, no shift model yet)
    const staffOnDuty = store.stylists.length;

    // ── 3. Weekly bar chart — appointments per day (Sun=0 … Sat=6) ───────────
    // Build array of date strings for the current week
    const weekDays = [];
    const dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d.toISOString().split("T")[0]);
    }

    const weeklyRaw = await Appointment.aggregate([
      {
        $match: {
          storeId,
          date: { $in: weekDays },
          status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE", "DONE"] },
        },
      },
      { $group: { _id: "$date", count: { $sum: 1 } } },
    ]);

    const weeklyMap = {};
    weeklyRaw.forEach((r) => { weeklyMap[r._id] = r.count; });

    const weeklyChart = weekDays.map((date, i) => ({
      day: dayLabels[i],
      date,
      count: weeklyMap[date] || 0,
    }));

    // ── 4. Specialists row ────────────────────────────────────────────────────
    // Stylists from store subdoc — isActive = store is open (no per-stylist shift)
    const specialists = store.stylists.map((s) => ({
      stylistId: s._id,
      fullName: s.fullName,
      photo: s.photo || null,
      role: s.role || null,
      rating: s.rating || 0,
      isActive: store.isOpen && !store.isPaused,
    }));

    // ── 5. Day schedule — today's appointments ────────────────────────────────
    const todayBookings = await Appointment.find({
      storeId,
      date: todayStr,
      status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE", "DONE"] },
    })
      .populate("client", "username")
      .sort({ time: 1 });

    const daySchedule = todayBookings.map((appt) => {
      // Client name: registered client username OR walk-in name
      const clientName = appt.isWalkIn
        ? appt.walkInClientName
        : appt.client?.username || "Unknown";

      // Stylist name from store.stylists subdoc
      const stylistMatch = store.stylists.find(
        (s) => String(s._id) === String(appt.stylist)
      );

      return {
        appointmentId: appt._id,
        time: appt.time,
        clientName,
        serviceName: appt.service?.name || null,
        stylistId: appt.stylist,
        stylistName: stylistMatch?.fullName || null,
        status: appt.status,
        queueNumber: appt.queueNumber || null,
        isWalkIn: appt.isWalkIn || false,
      };
    });

    // ── 6. Top performer this week ────────────────────────────────────────────
    const topPerformerAgg = await Appointment.aggregate([
      {
        $match: {
          storeId,
          date: { $in: weekDays },
          status: "DONE",
        },
      },
      {
        $group: {
          _id: "$stylist",
          completedServices: { $sum: 1 },
          totalRevenue: { $sum: "$service.price" },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { completedServices: -1 } },
      { $limit: 1 },
    ]);

    let topPerformer = null;
    if (topPerformerAgg.length > 0) {
      const tp = topPerformerAgg[0];
      const stylistMatch = store.stylists.find(
        (s) => String(s._id) === String(tp._id)
      );
      topPerformer = {
        stylistId: tp._id,
        fullName: stylistMatch?.fullName || "Unknown",
        photo: stylistMatch?.photo || null,
        role: stylistMatch?.role || null,
        completedServices: tp.completedServices,
        totalRevenue: tp.totalRevenue,
        avgRating: tp.avgRating ? Math.round(tp.avgRating * 10) / 10 : null,
      };
    }

    return res.status(200).json({
      storeName: store.storeName,
      isOpen: store.isOpen,
      isPaused: store.isPaused,
      stats: {
        todayAppointments,
        clientsServedToday,
        staffOnDuty,
      },
      weeklyChart,
      specialists,
      daySchedule,
      topPerformer,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};