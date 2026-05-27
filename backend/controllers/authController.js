exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions });
    if (!user)
      return res.status(404).json({ message: "No account found" });

    // ✅ Check if OTP is locked due to too many attempts
    if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
      const minutesLeft = Math.ceil(
        (user.otpLockedUntil - Date.now()) / (1000 * 60)
      );
      return res.status(429).json({
        message: `Too many wrong attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // ✅ Check OTP is valid and not expired
    if (!user.otp || user.otp !== otp || user.otpExpiry < Date.now()) {
      // Increment attempt counter
      user.otpAttempts = (user.otpAttempts || 0) + 1;

      // ✅ Lock after 5 wrong attempts for 15 minutes
      if (user.otpAttempts >= 5) {
        user.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.otpAttempts = 0;
        await user.save();
        return res.status(429).json({
          message: "Too many wrong attempts. OTP locked for 15 minutes.",
        });
      }

      await user.save();
      return res.status(400).json({
        message: "Invalid or expired OTP",
        attemptsLeft: 5 - user.otpAttempts,
      });
    }

    // ✅ OTP correct — reset attempts
    user.otpAttempts = 0;
    user.otpLockedUntil = null;
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
};