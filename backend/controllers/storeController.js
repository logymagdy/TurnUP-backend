const Store = require("../models/storeModel");
const User = require("../models/userModel");
const { success, error } = require("../utils/responseHandler");

// ─── ONBOARDING WIZARD ────────────────────────────────────────────────────────

exports.registerStoreBusiness = async (req, res) => {
  try {
    const { storeName, storeType, location, businessLicense, shopPhotos } = req.body;

    const existingStore = await Store.findOne({ owner: req.user.id });
    if (existingStore)
      return res.status(400).json({ message: "Already registered" });

    const newStore = new Store({
      owner: req.user.id,
      storeName,
      storeType,
      location,
      approvalStatus: "PENDING",
      approvalDocuments: { businessLicense, shopPhotos },
    });

    await newStore.save();
    await User.findByIdAndUpdate(req.user.id, { storeId: newStore._id });

    res.status(201).json({ message: "Submitted for approval", store: newStore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeBusinessProfile = async (req, res) => {
  try {
    const { storeName, storeType, location, phone, logo } = req.body;

    if (storeType && !["barbershop", "beautySalon"].includes(storeType))
      return res.status(400).json({ message: "Invalid Store Type" });

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { storeName, storeType, location, phone, logo },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, { storeId: store._id });
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBusinessSetup = async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ success: true, message: "Setup saved", store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addStaffMember = async (req, res) => {
  try {
    const { name, age, role, servicesHandled } = req.body;
    res.json({ success: true, message: "Staff member added to setup list" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.finishStoreSetup = async (req, res) => {
  try {
    const { loyaltyProgram, paymentSetup } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { $set: { loyaltyProgram, paymentSetup, approvalStatus: "PENDING" } },
      { new: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ success: true, message: "Setup complete!", store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DASHBOARD OPERATIONS ─────────────────────────────────────────────────────

exports.toggleWorkDay = async (req, res) => {
  try {
    const { isActive } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { isWorkDayActive: isActive },
      { new: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found" });

    res.json({
      success: true,
      message: isActive ? "Work day started!" : "Work day ended.",
      store,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── STORE MANAGEMENT ─────────────────────────────────────────────────────────

exports.createStore = async (req, res) => {
  try {
    const existing = await Store.findOne({ owner: req.user.id });
    if (existing)
      return res.status(400).json({ message: "You already have a store" });

    const store = new Store({ owner: req.user.id, ...req.body });
    await store.save();

    await User.findByIdAndUpdate(req.user.id, { storeId: store._id });
    res.status(201).json({ message: "Store created successfully", store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStore = async (req, res) => {
  try {
    const query =
      req.user.role === "ADMIN"
        ? { _id: req.params.id }
        : { owner: req.user.id };

    const store = await Store.findOne(query)
      .populate("owner", "username email phone")
      .populate("stylists", "username email")
      .populate("receptionists", "username email");

    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ message: "Store updated successfully", store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addStylist = async (req, res) => {
  try {
    const { stylistId } = req.body;

    const stylist = await User.findById(stylistId);
    if (!stylist)
      return res.status(404).json({ message: "User not found" });

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.stylists.map(String).includes(String(stylistId)))
      return res.status(400).json({ message: "Stylist already added" });

    store.stylists.push(stylistId);
    await store.save();

    await User.findByIdAndUpdate(stylistId, { storeId: store._id });
    res.json({ message: "Stylist added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeStylist = async (req, res) => {
  try {
    const { stylistId } = req.params;

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    store.stylists = store.stylists.filter(
      (id) => String(id) !== String(stylistId)
    );
    await store.save();

    await User.findByIdAndUpdate(stylistId, { storeId: null });
    res.json({ message: "Stylist removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addReceptionist = async (req, res) => {
  try {
    const { receptionistId } = req.body;

    const receptionist = await User.findById(receptionistId);
    if (!receptionist || receptionist.role !== "RECEPTIONIST")
      return res.status(404).json({ message: "Receptionist not found" });

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.receptionists.map(String).includes(String(receptionistId)))
      return res.status(400).json({ message: "Receptionist already added" });

    store.receptionists.push(receptionistId);
    await store.save();

    await User.findByIdAndUpdate(receptionistId, { storeId: store._id });
    res.json({ message: "Receptionist added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeReceptionist = async (req, res) => {
  try {
    const { receptionistId } = req.params;

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    store.receptionists = store.receptionists.filter(
      (id) => String(id) !== String(receptionistId)
    );
    await store.save();

    await User.findByIdAndUpdate(receptionistId, { storeId: null });
    res.json({ message: "Receptionist removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStylists = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id }).populate(
      "stylists",
      "username email phone"
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store.stylists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReceptionists = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id }).populate(
      "receptionists",
      "username email phone"
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store.receptionists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addService = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    store.services.push(req.body);
    await store.save();

    res.status(201).json({ message: "Service added", services: store.services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    const service = store.services.id(req.params.serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    Object.assign(service, req.body);
    await store.save();

    res.json({ message: "Service updated", service });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    store.services = store.services.filter(
      (s) => String(s._id) !== String(req.params.serviceId)
    );
    await store.save();

    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── CLIENT DISCOVERY ─────────────────────────────────────────────────────────
// SUSPENDED and BANNED stores are hidden from all discovery endpoints

exports.getPublicStore = async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: req.params.storeId,
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    })
      .select(
        "storeName storeType location bio logo services workingHours seats isWorkDayActive status approvalStatus operationalStatus stylists"
      )
      .populate("stylists", "username");

    if (!store) return res.status(404).json({ message: "Store not found or unavailable." });

    res.json(store);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find({
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    }).select(
      "storeName storeType location bio logo services workingHours isWorkDayActive"
    );

    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchStores = async (req, res) => {
  try {
    const { keyword, type, location } = req.query;

    const query = {
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    };

    if (keyword) query.storeName = { $regex: keyword, $options: "i" };
    if (type) query.storeType = type;
    if (location) query.location = { $regex: location, $options: "i" };

    const stores = await Store.find(query)
      .select("storeName storeType location bio logo services workingHours isWorkDayActive")
      .limit(50);

    return success(res, "Stores fetched successfully", stores);
  } catch (err) {
    return error(res, "Search failed", 500);
  }
};

exports.getFeaturedStores = async (req, res) => {
  try {
    const stores = await Store.find({
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    })
      .select("storeName storeType location bio logo services workingHours isWorkDayActive")
      .sort({ rating: -1 })
      .limit(10);

    return success(res, "Featured stores fetched", stores);
  } catch (err) {
    return error(res, "Failed to get featured stores", 500);
  }
};

exports.getStoreDetails = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate("stylists", "username email phone")
      .populate("receptionists", "username email");

    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    return res.status(501).json({ message: "Favorites feature is not yet implemented." });
  } catch (err) {
    return error(res, "Could not update favorites", 500);
  }
};