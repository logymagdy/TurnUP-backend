// ❌ Wrong
exports.registerUser = async (req, res) => {
  try {
    // ...
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Correct
exports.registerUser = async (req, res, next) => {
  try {
    // ...
  } catch (err) {
    next(err);
  }
};