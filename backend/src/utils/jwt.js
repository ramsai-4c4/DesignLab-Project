const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "linkvault-dev-secret-change-me";
const EXPIRES_IN = "7d";

function signToken(userId) {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
