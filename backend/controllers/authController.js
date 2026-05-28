// ─── BUSINESS LOGIN ───────────────────────────────────────────────────────────
exports.loginBusiness = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions }).select("+password");

    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Only serviceProvider can use business login
    if (user.role !== "serviceProvider")
      return res.status(403).json({
        message: "This login is for business owners only.",
      });

    const token = generateToken(user._id, user.role, user.storeId);
    const refreshToken = generateRefreshToken(user._id);

    // ✅ Get store info
    const Store = require("../models/storeModel");
    const store = await Store.findOne({ owner: user._id }).select(
      "storeName storeType logo approvalStatus subscriptionStatus trialEndsAt isOpen"
    );

    return res.json({
      message: "Business login successful",
      token,
      refreshToken,
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      storeId: user.storeId || null,
      track: "BUSINESS",
      store: store || null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── RECEPTIONIST LOGIN ───────────────────────────────────────────────────────
exports.loginReceptionist = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions }).select("+password");

    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Only RECEPTIONIST role can use this login
    if (user.role !== "RECEPTIONIST")
      return res.status(403).json({
        message: "This login is for receptionists only.",
      });

    if (!user.storeId)
      return res.status(403).json({
        message: "You are not linked to any store yet. Contact your store owner.",
      });

    const token = generateToken(user._id, user.role, user.storeId);
    const refreshToken = generateRefreshToken(user._id);

    const Store = require("../models/storeModel");
    const store = await Store.findById(user.storeId).select(
      "storeName storeType logo isOpen isPaused"
    );

    return res.json({
      message: "Receptionist login successful",
      token,
      refreshToken,
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      storeId: user.storeId,
      track: "BUSINESS",
      store: store || null,
    });
  } catch (err) {
    next(err);
  }
};