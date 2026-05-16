const { verifyAccess } = require("../utils/jwt");
const User = require("../models/User.model");

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccess(token);
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const user = await User.findById(payload.id).select("-password -refreshTokens");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or deactivated." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
