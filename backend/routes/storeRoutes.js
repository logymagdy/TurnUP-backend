const express = require("express");
const router = express.Router();
const {
  registerStoreBusiness,
  completeBusinessProfile,
  updateBusinessSetup,
  addStaffMember,
  finishStoreSetup,
  toggleWorkDay,
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
  toggleFavorite,
  getAllStores,
  getStoreDetails,
} = require("../controllers/storeController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
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

// ─── CLIENT DISCOVERY ─────────────────────────────────────────────────────────
router.get("/all", protect, getAllStores);
router.get("/featured", protect, getFeaturedStores);
router.get("/view/:id", protect, getStoreDetails);
router.post("/:storeId/favorite", protect, toggleFavorite);

module.exports = router;