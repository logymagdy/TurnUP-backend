const Queue = require("../models/queueModel");

// Get Today's Live Queue (Screen 2)
exports.getLiveQueue = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ storeId: req.user.storeId, date: today })
      .populate("entries.client", "name photo")
      .populate("entries.stylist", "name");

    if (!queue) return res.status(404).json({ message: "No active queue for today" });

    res.json({
      totalWaitTime: "1h 45m", // Logic would calculate sum of service durations
      entries: queue.entries
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};