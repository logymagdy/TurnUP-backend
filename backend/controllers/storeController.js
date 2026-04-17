const Store = require("../models/storeModel");
const User = require("../models/userModel");
// Create Store
exports.createStore = async (req, res) => {
  try {
    const existing = await Store.findOne({ owner: req.user.id });
    if (existing)
      return res.status(400).json({ message: "Store already exists" });

    const store = new Store({ owner: req.user.id, ...req.body });
    await store.save();

    // Link storeId to provider user
    await User.findByIdAndUpdate(req.user.id, { storeId: store._id });

    res.status(201).json({ message: "Store created successfully", store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Store
exports.getStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id })
      .populate("owner", "name email")
      .populate("stylists", "name email")
      .populate("receptionists", "name email");

    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Store
exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      req.body,
      { new: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ message: "Store updated successfully", store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add Stylist
exports.addStylist = async (req, res) => {
  try {
    const { stylistId } = req.body;

    const stylist = await User.findById(stylistId);
    if (!stylist)
      return res.status(404).json({ message: "User not found" });

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.stylists.includes(stylistId))
      return res.status(400).json({ message: "Stylist already in store" });

    store.stylists.push(stylistId);
    await store.save();

    await User.findByIdAndUpdate(stylistId, { storeId: store._id });

    res.json({ message: "Stylist added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add Receptionist
exports.addReceptionist = async (req, res) => {
  try {
    const { receptionistId } = req.body;

    const receptionist = await User.findById(receptionistId);
    if (!receptionist || receptionist.role !== "RECEPTIONIST")
      return res.status(404).json({ message: "Receptionist not found" });

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.receptionists.includes(receptionistId))
      return res.status(400).json({ message: "Receptionist already in store" });

    store.receptionists.push(receptionistId);
    await store.save();

    await User.findByIdAndUpdate(receptionistId, { storeId: store._id });

    res.json({ message: "Receptionist added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Stylists
exports.getStylists = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id })
      .populate("stylists", "name email");
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store.stylists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Receptionists
exports.getReceptionists = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id })
      .populate("receptionists", "name email");
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store.receptionists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};