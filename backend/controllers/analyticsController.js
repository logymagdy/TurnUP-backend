const mongoose = require("mongoose");
const Payment = require("../models/paymentModel");
const Appointment = require("../models/appointmentModel");

exports.getStoreAnalytics = async (req, res) => {
  try {
    const storeId = new mongoose.Types.ObjectId(String(req.user.storeId));

    const totalRevenueResult = await Payment.aggregate([
      { $match: { storeId, status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const bookingStats = await Appointment.aggregate([
      { $match: { storeId } },
      { $group: { _id: "$bookingType", count: { $sum: 1 } } },
    ]);

    let walkInCount = 0;
    let onlineCount = 0;
    bookingStats.forEach((stat) => {
      if (stat._id === "NORMAL") walkInCount = stat.count;
      else onlineCount += stat.count;
    });

    const totalBookings = walkInCount + onlineCount;
    const walkInPercentage =
      totalBookings > 0 ? Math.round((walkInCount / totalBookings) * 100) : 0;
    const onlinePercentage =
      totalBookings > 0 ? Math.round((onlineCount / totalBookings) * 100) : 0;

    const peakHours = await Appointment.aggregate([
      { $match: { storeId } },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const topServices = await Appointment.aggregate([
      { $match: { storeId } },
      { $group: { _id: "$service.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", count: 1, _id: 0 } },
    ]);

    res.json({
      totalRevenue: totalRevenueResult[0]?.total || 0,
      walkInPercentage,
      onlinePercentage,
      peakHours,
      topServices,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};