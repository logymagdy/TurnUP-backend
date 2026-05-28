const Store = require("../models/storeModel");
const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const { success, error } = require("../utils/responseHandler");

// ─── STEP 1: Business Info ────────────────────────────────────────────────────
exports.registerStoreBusiness = async (req, res) => {
  try {
    const {
      storeName,
      logo,
      storeType,
      bio,
      location,
      coordinates,
    } = req.body;

    if (!storeName || !storeType)
      return res.status(400).json({ message: "storeName and storeType are required." });

    if (!["barbershop", "beautySalon"].includes(storeType))
      return res.status(400).json({ message: "storeType must be barbershop or beautySalon." });

    const existingStore = await Store.findOne({ owner: req.user.id });
    if (existingStore)
      return res.status(400).json({ message: "You already have a store registered." });

    const newStore = new Store({
      owner: req.user.id,
      storeName,
      logo: logo || null,
      storeType,
      bio: bio || null,
      location: location || null,
      coordinates: coordinates || { lat: null, lng: null },
      approvalStatus: "PENDING",
    });

    await newStore.save();
    await User.findByIdAndUpdate(req.user.id, { storeId: newStore._id });

    return res.status(201).json({
      message: "Step 1 saved.",
      storeId: newStore._id,
      store: newStore,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── STEP 2: Gallery & Documents ─────────────────────────────────────────────
exports.saveStoreDocuments = async (req, res) => {
  try {
    const { gallery, businessLicense } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      {
        $set: {
          gallery: gallery || [],
          businessLicense: businessLicense || null,
        },
      },
      { returnDocument: "after" }
    );

    if (!store) return res.status(404).json({ message: "Store not found." });

    return res.status(200).json({ message: "Step 2 saved.", store });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── STEP 3: Schedule & Settings ─────────────────────────────────────────────
exports.saveStoreSchedule = async (req, res) => {
  try {
    const {
      workingDays,
      openingTime,
      closingTime,
      acceptWalkIns,
      acceptOnlineBookings,
      autoAssignStaff,
      showEstimatedWaitTime,
      instagramUsername,
      followersCount,
      phone,
    } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      {
        $set: {
          "workingHours.days": workingDays || [],
          "workingHours.opening": openingTime || "09:00",
          "workingHours.closing": closingTime || "21:00",
          "settings.acceptWalkIns": acceptWalkIns ?? true,
          "settings.acceptOnlineBookings": acceptOnlineBookings ?? true,
          "settings.autoAssignStaff": autoAssignStaff ?? true,
          "settings.showEstimatedWaitTime": showEstimatedWaitTime ?? true,
          "socialPresence.instagramUsername": instagramUsername || null,
          "socialPresence.followersCount": followersCount || 0,
          phone: phone || null,
        },
      },
      { returnDocument: "after" }
    );

    if (!store) return res.status(404).json({ message: "Store not found." });

    return res.status(200).json({ message: "Step 3 saved.", store });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── STEP 4: Services ─────────────────────────────────────────────────────────
exports.addService = async (req, res) => {
  try {
    const {
      name,
      photo,
      durationMinutes,
      price,
      discountPercent,
      description,
    } = req.body;

    if (!name || !durationMinutes || !price)
      return res.status(400).json({
        message: "name, durationMinutes and price are required.",
      });

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    store.services.push({
      name,
      photo: photo || null,
      durationMinutes: parseInt(durationMinutes),
      price: parseFloat(price),
      discountPercent: parseFloat(discountPercent) || 0,
      description: description || null,
      isActive: true,
    });

    await store.save();

    return res.status(201).json({
      message: "Service added successfully.",
      services: store.services,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    const service = store.services.id(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found." });

    const {
      name,
      photo,
      durationMinutes,
      price,
      discountPercent,
      description,
      isActive,
    } = req.body;

    if (name) service.name = name;
    if (photo !== undefined) service.photo = photo;
    if (durationMinutes) service.durationMinutes = parseInt(durationMinutes);
    if (price) service.price = parseFloat(price);
    if (discountPercent !== undefined) service.discountPercent = parseFloat(discountPercent);
    if (description !== undefined) service.description = description;
    if (isActive !== undefined) service.isActive = isActive;

    await store.save();

    return res.status(200).json({ message: "Service updated.", service });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    store.services = store.services.filter(
      (s) => String(s._id) !== String(serviceId)
    );
    await store.save();

    return res.status(200).json({ message: "Service deleted." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── STEP 5: Stylists ─────────────────────────────────────────────────────────
// ✅ Stylists stored inside store document — shown to clients with photo and services
exports.addStylistToStore = async (req, res) => {
  try {
    const {
      fullName,
      photo,
      age,
      role,
      assignedServices,
      payoutAccount,
    } = req.body;

    if (!fullName)
      return res.status(400).json({ message: "fullName is required." });

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    if (assignedServices && assignedServices.length > 0) {
      const serviceNames = store.services.map((s) => s.name);
      const invalid = assignedServices.filter(
        (s) => !serviceNames.includes(s)
      );
      if (invalid.length > 0)
        return res.status(400).json({
          message: `Services not found in store: ${invalid.join(", ")}`,
        });
    }

    store.stylists.push({
      fullName,
      photo: photo || null,
      age: age || null,
      role: role || null,
      assignedServices: assignedServices || [],
      payoutAccount: payoutAccount || null,
      rating: 0,
      reviewCount: 0,
    });

    await store.save();

    return res.status(201).json({
      message: "Stylist added successfully.",
      stylists: store.stylists,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ✅ Route alias — storeRoutes imports addStylist not addStylistToStore
exports.addStylist = exports.addStylistToStore;

exports.updateStylist = async (req, res) => {
  try {
    const { stylistId } = req.params;

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    const stylist = store.stylists.id(stylistId);
    if (!stylist) return res.status(404).json({ message: "Stylist not found." });

    const {
      fullName,
      photo,
      age,
      role,
      assignedServices,
      payoutAccount,
    } = req.body;

    if (fullName) stylist.fullName = fullName;
    if (photo !== undefined) stylist.photo = photo;
    if (age !== undefined) stylist.age = age;
    if (role !== undefined) stylist.role = role;
    if (assignedServices) stylist.assignedServices = assignedServices;
    if (payoutAccount !== undefined) stylist.payoutAccount = payoutAccount;

    await store.save();

    return res.status(200).json({ message: "Stylist updated.", stylist });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.removeStylistFromStore = async (req, res) => {
  try {
    const { stylistId } = req.params;

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    store.stylists = store.stylists.filter(
      (s) => String(s._id) !== String(stylistId)
    );
    await store.save();

    return res.status(200).json({ message: "Stylist removed." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ✅ Route alias — storeRoutes imports removeStylist not removeStylistFromStore
exports.removeStylist = exports.removeStylistFromStore;

exports.getStoreStylistsForClient = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId).select("stylists");
    if (!store) return res.status(404).json({ message: "Store not found." });

    return res.status(200).json({
      message: "Stylists retrieved.",
      stylists: store.stylists,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getStylists = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id }).select("stylists");
    if (!store) return res.status(404).json({ message: "Store not found." });
    return res.status(200).json({ stylists: store.stylists });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── RECEPTIONIST MANAGEMENT ──────────────────────────────────────────────────
exports.addReceptionist = async (req, res) => {
  try {
    const { receptionistId } = req.body;

    const receptionist = await User.findById(receptionistId);
    if (!receptionist || receptionist.role !== "RECEPTIONIST")
      return res.status(404).json({ message: "Receptionist not found." });

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    if (store.receptionists.map(String).includes(String(receptionistId)))
      return res.status(400).json({ message: "Already linked to this store." });

    store.receptionists.push(receptionistId);
    await store.save();

    await User.findByIdAndUpdate(receptionistId, { storeId: store._id });

    return res.status(200).json({ message: "Receptionist linked.", store });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.removeReceptionist = async (req, res) => {
  try {
    const { receptionistId } = req.params;

    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    store.receptionists = store.receptionists.filter(
      (r) => String(r) !== String(receptionistId)
    );
    await store.save();

    await User.findByIdAndUpdate(receptionistId, { storeId: null });

    return res.status(200).json({ message: "Receptionist removed." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getReceptionists = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id }).populate(
      "receptionists", "username email phone"
    );
    if (!store) return res.status(404).json({ message: "Store not found." });
    return res.status(200).json({ receptionists: store.receptionists });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── ONBOARDING WIZARD ALIASES ────────────────────────────────────────────────
// storeRoutes imports these names — they map to the step functions above
exports.completeBusinessProfile = exports.saveStoreDocuments;   // step 2
exports.updateBusinessSetup = exports.saveStoreSchedule;        // step 3
exports.addStaffMember = exports.addStylistToStore;             // step 5
// ─── STEP 7: Loyalty Program ──────────────────────────────────────────────────
exports.saveLoyaltyProgram = async (req, res) => {
  try {
    const {
      enabled,
      pointsPerVisit,
      pointsPerEGP,
      maxDiscountPercent,
      referralReward,
      cancellationCompensation,
      onlinePaymentBonus,
      vipThreshold,
      pointsExpiryMonths,
    } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      {
        $set: {
          "loyaltyProgram.enabled": enabled ?? false,
          "loyaltyProgram.pointsPerVisit": pointsPerVisit ?? 10,
          "loyaltyProgram.pointsPerEGP": pointsPerEGP ?? 1,
          "loyaltyProgram.maxDiscountPercent": maxDiscountPercent ?? 50,
          "loyaltyProgram.referralReward": referralReward ?? 20,
          "loyaltyProgram.cancellationCompensation": cancellationCompensation ?? 50,
          "loyaltyProgram.onlinePaymentBonus": onlinePaymentBonus ?? 10,
          "loyaltyProgram.vipThreshold": vipThreshold ?? 1000,
          "loyaltyProgram.pointsExpiryMonths": pointsExpiryMonths ?? 6,
        },
      },
      { returnDocument: "after" }
    );

    if (!store) return res.status(404).json({ message: "Store not found." });

    return res.status(200).json({
      message: "Step 7 saved.",
      loyaltyProgram: store.loyaltyProgram,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Fix alias — finishStoreSetup must point to the function defined above
exports.finishStoreSetup = exports.saveLoyaltyProgram;

// ─── STEP 9: Subscription ────────────────────────────────────────────────────
exports.activateSubscription = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found." });

    const now = new Date();
    const trialEnd = new Date(store.trialEndsAt);

    if (now < trialEnd) {
      return res.status(200).json({
        message: "You are still in your free trial.",
        trialEndsAt: store.trialEndsAt,
        daysLeft: Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)),
        subscriptionStatus: "TRIAL",
      });
    }

    store.subscriptionStatus = "SUBSCRIBED";
    store.subscribedAt = now;
    await store.save();

    return res.status(200).json({
      message: "Subscription activated successfully.",
      subscriptionStatus: "SUBSCRIBED",
      subscribedAt: now,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id }).select(
      "subscriptionStatus trialStartDate trialEndsAt subscribedAt storeName"
    );
    if (!store) return res.status(404).json({ message: "Store not found." });

    const now = new Date();
    const trialEnd = new Date(store.trialEndsAt);
    const daysLeft = Math.max(
      0,
      Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
    );

    return res.status(200).json({
      subscriptionStatus: store.subscriptionStatus,
      trialEndsAt: store.trialEndsAt,
      daysLeft: store.subscriptionStatus === "TRIAL" ? daysLeft : null,
      subscribedAt: store.subscribedAt,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── STORE PROFILE ───────────────────────────────────────────────────────────
exports.getStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user.id }).populate(
      "receptionists",
      "username email phone"
    );
    if (!store) return res.status(404).json({ message: "Store not found." });
    return res.status(200).json(store);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { $set: req.body },
      { returnDocument: "after", runValidators: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found." });
    return res.status(200).json({ message: "Store updated.", store });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createStore = async (req, res) => {
  try {
    const { storeName, storeType, location, logo, bio } = req.body;

    if (!storeName || !storeType)
      return res.status(400).json({ message: "storeName and storeType are required." });

    const store = new Store({
      owner: req.user.id,
      storeName,
      storeType,
      location: location || null,
      logo: logo || null,
      bio: bio || null,
    });

    await store.save();
    await User.findByIdAndUpdate(req.user.id, { storeId: store._id });

    return res.status(201).json({ message: "Store created.", store });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── TOGGLE WORKDAY ───────────────────────────────────────────────────────────
exports.toggleWorkDay = async (req, res) => {
  try {
    const { isActive } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      {
        isWorkDayActive: isActive,
        isOpen: isActive,
        isPaused: false,
      },
      { returnDocument: "after" }
    );
    if (!store) return res.status(404).json({ message: "Store not found." });

    return res.status(200).json({
      message: isActive ? "Work day started!" : "Work day ended.",
      store,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.pauseStore = async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { isPaused: true },
      { returnDocument: "after" }
    );
    if (!store) return res.status(404).json({ message: "Store not found." });
    return res.status(200).json({ message: "Store paused.", store });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.resumeStore = async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { isPaused: false },
      { returnDocument: "after" }
    );
    if (!store) return res.status(404).json({ message: "Store not found." });
    return res.status(200).json({ message: "Store resumed.", store });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── CLIENT DISCOVERY ─────────────────────────────────────────────────────────
exports.getPublicStore = async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: req.params.storeId,
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    }).select(
      "storeName storeType location bio logo services stylists gallery workingHours settings rating numReviews isOpen isPaused viewCount loyaltyProgram"
    );

    if (!store)
      return res.status(404).json({ message: "Store not found or unavailable." });

    await Store.findByIdAndUpdate(req.params.storeId, {
      $inc: { viewCount: 1 },
    });

    return res.status(200).json(store);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllStores = async (req, res) => {
  try {
    const { gender } = req.query;

    const query = {
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    };

    if (gender === "MEN") query.storeType = "barbershop";
    else if (gender === "WOMEN") query.storeType = "beautySalon";

    const stores = await Store.find(query).select(
      "storeName storeType location bio logo services workingHours isOpen isPaused rating numReviews"
    );

    return res.status(200).json(stores);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getFeaturedStores = async (req, res) => {
  try {
    const { gender } = req.query;

    const query = {
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    };

    if (gender === "MEN") query.storeType = "barbershop";
    else if (gender === "WOMEN") query.storeType = "beautySalon";

    const stores = await Store.find(query)
      .select(
        "storeName storeType location bio logo services workingHours isOpen rating numReviews"
      )
      .sort({ rating: -1 })
      .limit(10);

    return success(res, "Featured stores fetched", stores);
  } catch (err) {
    return error(res, "Failed to get featured stores", 500);
  }
};

exports.getStoreDetails = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate(
      "receptionists",
      "username email"
    );
    if (!store) return res.status(404).json({ message: "Store not found." });

    await Store.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    return res.status(200).json(store);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.searchStores = async (req, res) => {
  try {
    const { keyword, type, location, date, time, service, minRating, gender } =
      req.query;

    const query = {
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    };

    if (gender === "MEN") query.storeType = "barbershop";
    else if (gender === "WOMEN") query.storeType = "beautySalon";

    if (keyword) {
      query.$or = [
        { storeName: { $regex: keyword, $options: "i" } },
        { "services.name": { $regex: keyword, $options: "i" } },
        { bio: { $regex: keyword, $options: "i" } },
        { location: { $regex: keyword, $options: "i" } },
      ];
    }

    if (type) query.storeType = type;
    if (location) query.location = { $regex: location, $options: "i" };
    if (service) query["services.name"] = { $regex: service, $options: "i" };
    if (minRating) query.rating = { $gte: parseFloat(minRating) };

    if (date) {
      const dayName = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      query["workingHours.days"] = dayName;
    }

    let stores = await Store.find(query)
      .select(
        "storeName storeType location bio logo services workingHours isOpen isPaused rating numReviews"
      )
      .limit(50);

    if (date && time) {
      const storeIds = stores.map((s) => s._id);
      const bookedAppointments = await Appointment.find({
        storeId: { $in: storeIds },
        date,
        time,
        status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"] },
      }).select("storeId stylist");

      const bookedMap = {};
      bookedAppointments.forEach((a) => {
        const sid = String(a.storeId);
        if (!bookedMap[sid]) bookedMap[sid] = new Set();
        bookedMap[sid].add(String(a.stylist));
      });

      stores = stores.filter((store) => {
        const booked = bookedMap[String(store._id)] || new Set();
        const totalStylists = store.stylists?.length || 0;
        return booked.size < totalStylists || totalStylists === 0;
      });
    }

    return success(res, "Stores fetched successfully", stores);
  } catch (err) {
    return error(res, "Search failed", 500);
  }
};

exports.getStoresWithOffers = async (req, res) => {
  try {
    const { gender } = req.query;
    const now = new Date();
    const Promotion = require("../models/promotionModel");

    const storeMatch = {
      approvalStatus: "APPROVED",
      operationalStatus: { $in: ["ACTIVE", "UNDER_INVESTIGATION"] },
    };

    if (gender === "MEN") storeMatch.storeType = "barbershop";
    else if (gender === "WOMEN") storeMatch.storeType = "beautySalon";

    const activePromotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate({
      path: "storeId",
      select:
        "storeName storeType logo rating numReviews services location approvalStatus operationalStatus",
      match: storeMatch,
    });

    const offers = activePromotions
      .filter((p) => p.storeId)
      .map((p) => ({
        promotionId: p._id,
        discountPercentage: p.discountPercentage,
        description: p.description,
        services: p.services,
        endDate: p.endDate,
        store: p.storeId,
      }));

    return success(res, "Offers fetched successfully", offers);
  } catch (err) {
    return error(res, "Failed to get offers", 500);
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { date, stylistId } = req.query;

    if (!date)
      return res.status(400).json({ message: "date is required" });

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found." });

    const opening = store.workingHours?.opening || "09:00";
    const closing = store.workingHours?.closing || "21:00";
    const [openHour, openMin] = opening.split(":").map(Number);
    const [closeHour, closeMin] = closing.split(":").map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    const slots = [];
    for (let m = openMinutes; m < closeMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(
        `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
      );
    }

    const bookedQuery = {
      storeId,
      date,
      status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"] },
    };

    const bookedAppointments = await Appointment.find(bookedQuery).select(
      "time stylist"
    );

    const bookedByTime = {};
    bookedAppointments.forEach((a) => {
      if (!bookedByTime[a.time]) bookedByTime[a.time] = [];
      bookedByTime[a.time].push(String(a.stylist));
    });

    const stylists = stylistId
      ? store.stylists.filter((s) => String(s._id) === stylistId)
      : store.stylists;

    const now = new Date();

    const slotData = slots.map((time) => {
      const bookedStylistIds = bookedByTime[time] || [];
      const stylistAvailability = stylists.map((s) => ({
        stylistId: s._id,
        stylistName: s.fullName,
        avatar: s.photo,
        rating: s.rating,
        isAvailable: !bookedStylistIds.includes(String(s._id)),
      }));

      const hasAvailableStylist = stylistAvailability.some((s) => s.isAvailable);
      const [slotHour, slotMin] = time.split(":").map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(slotHour, slotMin, 0, 0);
      const isPast = slotDate < now;

      return {
        time,
        isAvailable: !isPast && hasAvailableStylist,
        isPast,
        availableCount: stylistAvailability.filter((s) => s.isAvailable).length,
        totalStylists: stylists.length,
        stylists: stylistAvailability,
      };
    });

    return res.status(200).json({
      message: "Available slots retrieved.",
      date,
      storeId,
      workingHours: { opening, closing },
      slots: slotData,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getStoreSpecialists = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { date, time } = req.query;

    const store = await Store.findById(storeId).select("stylists");
    if (!store) return res.status(404).json({ message: "Store not found." });

    let specialists = store.stylists.map((s) => ({
      stylistId: s._id,
      fullName: s.fullName,
      photo: s.photo,
      role: s.role,
      rating: s.rating || 0,
      reviewCount: s.reviewCount || 0,
      assignedServices: s.assignedServices,
      isAvailable: true,
    }));

    if (date && time) {
      const bookedAppointments = await Appointment.find({
        storeId,
        date,
        time,
        status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"] },
      }).select("stylist");

      const bookedIds = bookedAppointments.map((a) => String(a.stylist));
      specialists = specialists.map((s) => ({
        ...s,
        isAvailable: !bookedIds.includes(String(s.stylistId)),
      }));
    }

    return res.status(200).json({ message: "Specialists retrieved.", specialists });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getStoreQR = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { generateQRCode } = require("../utils/generateQRCode");

    const store = await Store.findById(storeId).select(
      "storeName approvalStatus operationalStatus"
    );
    if (!store) return res.status(404).json({ message: "Store not found." });
    if (store.approvalStatus !== "APPROVED")
      return res.status(403).json({ message: "Store not approved." });

    const qrDataUrl = await generateQRCode(storeId);
    return res.status(200).json({
      message: "QR code generated.",
      storeId,
      storeName: store.storeName,
      qrDataUrl,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── SETTINGS: BUSINESS NOTIFICATION PREFERENCES ─────────────────────────────
// GET  /api/store/notification-settings — Settings > Notifications screen
// Returns all 8 business notification toggles
// Access: serviceProvider + RECEPTIONIST
exports.getBusinessNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "businessNotificationSettings"
    );
    if (!user) return res.status(404).json({ message: "User not found." });

    // ✅ Return safe defaults for accounts created before this field existed
    const settings = user.businessNotificationSettings || {
      newBooking: true,
      bookingCancellation: true,
      noShowAlert: true,
      newWalkIn: true,
      queueDelay: true,
      pushNotifications: true,
      smsNotifications: true,
      emailNotifications: false,
    };

    return res.status(200).json({ settings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT  /api/store/notification-settings
// Body: any subset of the 8 boolean toggle fields
exports.updateBusinessNotificationSettings = async (req, res) => {
  try {
    const allowed = [
      "newBooking",
      "bookingCancellation",
      "noShowAlert",
      "newWalkIn",
      "queueDelay",
      "pushNotifications",
      "smsNotifications",
      "emailNotifications",
    ];

    const update = {};
    allowed.forEach((key) => {
      if (typeof req.body[key] === "boolean") {
        update[`businessNotificationSettings.${key}`] = req.body[key];
      }
    });

    if (Object.keys(update).length === 0)
      return res.status(400).json({ message: "No valid fields provided." });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select("businessNotificationSettings");

    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json({
      message: "Notification settings updated.",
      settings: user.businessNotificationSettings,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── SETTINGS: MONTHLY REVENUE GOAL ──────────────────────────────────────────
// PUT  /api/store/monthly-goal
// Sets the monthly revenue target shown on the analytics screen progress bar
// Access: serviceProvider only
exports.setMonthlyRevenueGoal = async (req, res) => {
  try {
    const { monthlyRevenueGoal } = req.body;

    if (monthlyRevenueGoal === undefined || monthlyRevenueGoal < 0)
      return res.status(400).json({ message: "monthlyRevenueGoal must be a positive number." });

    const store = await Store.findOneAndUpdate(
      { owner: req.user.id },
      { $set: { monthlyRevenueGoal: parseFloat(monthlyRevenueGoal) } },
      { returnDocument: "after" }
    );
    if (!store) return res.status(404).json({ message: "Store not found." });

    return res.status(200).json({
      message: "Monthly revenue goal updated.",
      monthlyRevenueGoal: store.monthlyRevenueGoal,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};