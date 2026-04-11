instapayNumber: {
  type: String,
  default: null,
},
loyaltyPoints: {
  type: Number,
  default: 0,
},
loyaltyTier: {
  type: String,
  enum: ["BRONZE", "SILVER", "GOLD"],
  default: "BRONZE",
},
referralCode: {
  type: String,
  unique: true,
  sparse: true,
},
referredBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
debt: {
  type: Number,
  default: 0,
},
savedCard: {
  type: String,
  default: null,
},
visitCount: {
  type: Number,
  default: 0,
},