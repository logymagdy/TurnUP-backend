const express = require("express");
const router = express.Router();
const {
  registerStoreBusiness,
  completeBusinessProfile,
  updateBusinessSetup,
  addStaffMember,
  finishStoreSetup,
  toggleWorkDay,
  pauseStore,
  resumeStore,
  createStore,
  getStore,
  updateStore,
  addStylist,
  removeStylist,
  addReceptionist,
  removeReceptionist,
  getStylists,
  getReceptionists,
  addService,
  updateService,
  saveStoreServices,
  saveDayControlSettings,
  getDayControlSettings,
  deleteService,
  getPublicStore,
  searchStores,
  getFeaturedStores,
  getAllStores,
  getStoreDetails,
  getAvailableSlots,
  getStoreSpecialists,
  getStoresWithOffers,
  getStoreQR,
  getStoreStylistsForClient,
  getBusinessNotificationSettings,
  updateBusinessNotificationSettings,
  setMonthlyRevenueGoal,
  activateSubscription,
  getSubscriptionStatus,
} = require("../controllers/storeController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const Store = require("../models/storeModel");

// #swagger.tags = ['Store']

// ─── PUBLIC (no auth needed) ──────────────────────────────────────────────────
router.get("/search", searchStores);
router.get("/public/:storeId", getPublicStore);

// ─── BUSINESS ONBOARDING ──────────────────────────────────────────────────────
// Step 1 — Business Info
router.post("/register-business", protect, allowRoles("serviceProvider"), registerStoreBusiness);

// Step 2 — Gallery & Documents
router.post("/complete-profile", protect, allowRoles("serviceProvider"), completeBusinessProfile);

// Step 3 — Schedule, Booking Rules, Social, Phone
router.put("/setup-wizard", protect, allowRoles("serviceProvider"), updateBusinessSetup);

// Step 4 — Services (bulk or single)
router.post("/setup/add-services", protect, allowRoles("serviceProvider"), saveStoreServices);

// Step 5 — Add Stylists
router.post("/setup/add-staff", protect, allowRoles("serviceProvider"), addStaffMember);

// Step 6 — Day Control Settings
router.get("/setup/day-control", protect, allowRoles("serviceProvider"), getDayControlSettings);
router.put("/setup/day-control", protect, allowRoles("serviceProvider"), saveDayControlSettings);

// Step 7 — Loyalty Program
router.put("/finish-setup", protect, allowRoles("serviceProvider"), finishStoreSetup);

// Step 8 — Accepted Payment Methods
router.post(
  "/setup/step8/payment-methods",
  protect,
  allowRoles("serviceProvider"),
  async (req, res) => {
    try {
      const { cash, card } = req.body;
      const store = await Store.findOneAndUpdate(
        { owner: req.user.id },
        {
          $set: {
            "acceptedPaymentMethods.cash": cash ?? true,
            "acceptedPaymentMethods.card": card ?? true,
          },
        },
        { returnDocument: "after" }
      );
      if (!store) return res.status(404).json({ message: "Store not found." });
      return res.status(200).json({
        message: "Step 8 saved.",
        acceptedPaymentMethods: store.acceptedPaymentMethods,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// Step 9 — Subscription
router.post("/setup/step9/subscribe", protect, allowRoles("serviceProvider"), activateSubscription);
router.get("/setup/subscription", protect, allowRoles("serviceProvider"), getSubscriptionStatus);

// ─── STORE OPERATIONS ─────────────────────────────────────────────────────────
router.patch("/toggle-workday", protect, allowRoles("serviceProvider", "RECEPTIONIST"), toggleWorkDay);
router.patch("/pause", protect, allowRoles("serviceProvider"), pauseStore);
router.patch("/resume", protect, allowRoles("serviceProvider"), resumeStore);
router.post("/create", protect, allowRoles("serviceProvider"), createStore);
router.get("/profile", protect, allowRoles("serviceProvider", "ADMIN", "RECEPTIONIST"), getStore);
router.put("/update", protect, allowRoles("serviceProvider"), updateStore);

// ─── STAFF MANAGEMENT ─────────────────────────────────────────────────────────
router.post("/add-stylist", protect, allowRoles("serviceProvider"), addStylist);
router.delete("/remove-stylist/:stylistId", protect, allowRoles("serviceProvider"), removeStylist);
router.post("/add-receptionist", protect, allowRoles("serviceProvider"), addReceptionist);
router.delete("/remove-receptionist/:receptionistId", protect, allowRoles("serviceProvider"), removeReceptionist);
router.get("/stylists", protect, allowRoles("serviceProvider", "ADMIN"), getStylists);
router.get("/receptionists", protect, allowRoles("serviceProvider", "ADMIN"), getReceptionists);

// ─── SERVICES MANAGEMENT ──────────────────────────────────────────────────────
router.post("/services", protect, allowRoles("serviceProvider"), addService);
router.put("/services/:serviceId", protect, allowRoles("serviceProvider"), updateService);
router.delete("/services/:serviceId", protect, allowRoles("serviceProvider"), deleteService);

// ─── SETTINGS: NOTIFICATION PREFERENCES ──────────────────────────────────────
router.get(
  "/notification-settings",
  protect,
  allowRoles("serviceProvider", "RECEPTIONIST"),
  getBusinessNotificationSettings
);
router.put(
  "/notification-settings",
  protect,
  allowRoles("serviceProvider", "RECEPTIONIST"),
  updateBusinessNotificationSettings
);

// ─── SETTINGS: MONTHLY REVENUE GOAL ──────────────────────────────────────────
router.put(
  "/monthly-goal",
  protect,
  allowRoles("serviceProvider"),
  setMonthlyRevenueGoal
);

// ─── CLIENT DISCOVERY ─────────────────────────────────────────────────────────
router.get("/all", protect, getAllStores);
router.get("/featured", protect, getFeaturedStores);
router.get("/offers", protect, getStoresWithOffers);
router.get("/view/:id", protect, getStoreDetails);

// ─── BOOKING FLOW ─────────────────────────────────────────────────────────────
router.get("/:storeId/stylists", protect, getStoreStylistsForClient);
router.get("/:storeId/slots", protect, getAvailableSlots);
router.get("/:storeId/specialists", protect, getStoreSpecialists);
router.get("/:storeId/qr", protect, getStoreQR);

module.exports = router;