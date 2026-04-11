approvalStatus: {
  type: String,
  enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
  default: "PENDING",
},
approvalDocuments: {
  businessLicense: String,
  shopPhotos: [String],
  ownerIdPhoto: String,
  address: String,
},
warnings: {
  type: Number,
  default: 0,
},
rejectionReason: {
  type: String,
  default: null,
},
suspensionReason: {
  type: String,
  default: null,
},
trialStartDate: {
  type: Date,
  default: null,
},
trialEndDate: {
  type: Date,
  default: null,
},
subscriptionStatus: {
  type: String,
  enum: ["TRIAL", "ACTIVE", "EXPIRED"],
  default: "TRIAL",
},