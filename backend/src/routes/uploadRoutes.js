const express = require("express");
const multer = require("multer");
const { body, param } = require("express-validator");
const ctrl = require("../controllers/uploadController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/* Multer – store in memory buffer (we'll push to Supabase) */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800, // 50 MB
  },
});

/* ─── Upload (text OR file) ─────────────────────────────────── */
router.post(
  "/upload",
  optionalAuth,
  upload.single("file"),
  [
    body("textContent")
      .optional()
      .isString()
      .isLength({ min: 1, max: 500000 })
      .withMessage("Text content must be between 1 and 500 000 characters."),
    body("expiresIn")
      .optional()
      .isInt({ min: 1 })
      .withMessage("expiresIn must be a positive integer (minutes)."),
    body("password")
      .optional()
      .isString()
      .isLength({ max: 128 })
      .withMessage("Password must be at most 128 characters."),
    body("maxViews")
      .optional()
      .isInt({ min: 1 })
      .withMessage("maxViews must be a positive integer."),
  ],
  (req, res, next) => {
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  ctrl.createUpload
);

/* ─── Get metadata (no password needed) ─────────────────────── */
router.get(
  "/:slug/meta",
  optionalAuth,
  [param("slug").isString().isLength({ min: 8, max: 30 })],
  ctrl.getMeta
);

/* ─── View / download content (POST so we can send password) ── */
router.post(
  "/:slug/view",
  [
    param("slug").isString().isLength({ min: 8, max: 30 }),
    body("password").optional().isString(),
  ],
  ctrl.viewContent
);

/* ─── Manual delete (uploader-only) ───── */
router.delete(
  "/:slug",
  requireAuth,
  [param("slug").isString().isLength({ min: 8, max: 30 })],
  ctrl.deleteUpload
);

/* ─── My uploads (requires auth) ───────────────────────── */
router.get("/my-uploads", requireAuth, ctrl.getMyUploads);

module.exports = router;
