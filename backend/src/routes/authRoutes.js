const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* ─── Register ──────────────────────────────────────────────── */
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: "Email already registered." });
      }

      const user = await User.create({ name, email, passwordHash: password });
      const token = signToken(user._id);

      return res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

/* ─── Login ─────────────────────────────────────────────────── */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const ok = await user.comparePassword(password);
      if (!ok) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = signToken(user._id);

      return res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

/* ─── Get current user ──────────────────────────────────────── */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
