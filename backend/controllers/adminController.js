const Store = require("../models/storeModel");

exports.approveStore = async (req, res) => {
  try {
    const { storeId, action } = req.body; // action: 'APPROVED' or 'REJECTED'
    
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    store.approvalStatus = action;
    if (action === 'REJECTED') {
        store.rejectionReason = req.body.reason;
    }
    
    await store.save();
    res.json({ message: `Store ${action} successfully`, store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};