const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: null },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    applicableServices: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);