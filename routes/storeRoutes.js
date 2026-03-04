const express = require("express");
const router = express.Router();
const {
  createStore,
  getStore,
  updateStore,
  addStylist,
  addReceptionist,
  getStylists,
  getReceptionists,
} = require("../controllers/storeController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

router.post("/create", protect, allowRoles("serviceProvider"), createStore);
router.get("/profile", protect, allowRoles("serviceProvider", "ADMIN"), getStore);
router.put("/update", protect, allowRoles("serviceProvider"), updateStore);
router.post("/add-stylist", protect, allowRoles("serviceProvider"), addStylist);
router.post("/add-receptionist", protect, allowRoles("serviceProvider"), addReceptionist);
router.get("/stylists", protect, allowRoles("serviceProvider", "ADMIN"), getStylists);
router.get("/receptionists", protect, allowRoles("serviceProvider", "ADMIN"), getReceptionists);
module.exports = router;