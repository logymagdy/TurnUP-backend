const mongoose = require("mongoose");
const Payment = require("../models/paymentModel");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");

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

    const bookingTypeStats = await Appointment.aggregate([
      { $match: { storeId } },
      { $group: { _id: "$bookingType", count: { $sum: 1 } } },
    ]);

    let walkInCount = 0;
    let onlineCount = 0;
    bookingTypeStats.forEach((stat) => {
      if (stat._id === "NORMAL") walkInCount = stat.count;
      else onlineCount += stat.count;
    });

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

    const stylistIds = stylistStats.map((s) => s._id);
    const stylists = await User.find({ _id: { $in: stylistIds } }).select("username");
    const stylistMap = {};
    stylists.forEach((s) => { stylistMap[String(s._id)] = s.username; });

    const stylistPerformance = stylistStats.map((s) => ({
      stylistId: s._id,
      stylistName: stylistMap[String(s._id)] || "Unknown",
      completedServices: s.completedServices,
      avgRating: s.avgRating ? Math.round(s.avgRating * 10) / 10 : null,
      totalRevenue: s.totalRevenue,
    }));

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