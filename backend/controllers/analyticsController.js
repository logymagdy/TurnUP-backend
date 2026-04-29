const Payment = require("../models/paymentModel");
const Appointment = require("../models/appointmentModel");

exports.getStoreAnalytics = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    // 1. Total Revenue from completed payments
    const totalRevenueResult = await Payment.aggregate([
      { $match: { storeId: storeId, status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 2. Walk-ins vs Online (Dynamic Percentage Calculation)
    const bookingStats = await Appointment.aggregate([
      { $match: { storeId: storeId } },
      { $group: { _id: "$bookingType", count: { $sum: 1 } } }
    ]);

    let walkInCount = 0;
    let onlineCount = 0;
    bookingStats.forEach(stat => {
      if (stat._id === "WALK_IN") walkInCount = stat.count;
      else onlineCount = stat.count;
    });

    const totalBookings = walkInCount + onlineCount;
    const walkInPercentage = totalBookings > 0 ? Math.round((walkInCount / totalBookings) * 100) : 0;
    const onlinePercentage = totalBookings > 0 ? Math.round((onlineCount / totalBookings) * 100) : 0;

    // 3. Peak Business Hours (Grouping by hour of the day)
    const peakHours = await Appointment.aggregate([
      { $match: { storeId: storeId } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 4. Top Services (Which services generate most bookings)
    const topServices = await Appointment.aggregate([
      { $match: { storeId: storeId } },
      { $group: { _id: "$service.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);

    res.json({
      totalRevenue: totalRevenueResult[0]?.total || 0,
      walkInPercentage,
      onlinePercentage,
      peakHours,
      topServices
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};