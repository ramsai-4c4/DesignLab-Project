const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

/**
 * Required auth – request must carry a valid JWT.
 * Attaches req.user (Mongoose doc) on success.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const token = header.split(" ")[1];
    const payload = verifyToken(token);

    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Optional auth – if a valid token is present, attach req.user;
 * otherwise continue without error (req.user will be undefined).
 */
async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      const payload = verifyToken(token);
      req.user = await User.findById(payload.id).select("-passwordHash");
    }
  } catch {
    /* ignore – no auth */
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
