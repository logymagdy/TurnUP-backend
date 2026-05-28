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
} = require("../controllers/storeController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// #swagger.tags = ['Store']

// ─── PUBLIC (no auth needed) ──────────────────────────────────────────────────
router.get("/search", searchStores);
router.get("/public/:storeId", getPublicStore);

// ─── BUSINESS ONBOARDING ──────────────────────────────────────────────────────
router.post("/register-business", protect, allowRoles("serviceProvider"), registerStoreBusiness);
router.post("/complete-profile", protect, allowRoles("serviceProvider"), completeBusinessProfile);
router.put("/setup-wizard", protect, allowRoles("serviceProvider"), updateBusinessSetup);
router.post("/setup/add-staff", protect, allowRoles("serviceProvider"), addStaffMember);
router.put("/finish-setup", protect, allowRoles("serviceProvider"), finishStoreSetup);

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
// Settings > Notifications screen — business-specific toggles
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
// Settings > Analytics screen — set target for monthly goal progress bar
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