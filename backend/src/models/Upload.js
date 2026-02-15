const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    /* Unique slug used in the shareable URL */
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /* Content type: "text" or "file" */
    type: {
      type: String,
      enum: ["text", "file"],
      required: true,
    },

    /* --- Text uploads --- */
    textContent: {
      type: String,
      default: null,
    },

    /* --- File uploads (stored in Supabase) --- */
    fileName: { type: String, default: null },
    fileMimeType: { type: String, default: null },
    fileSize: { type: Number, default: null },
    supabasePath: { type: String, default: null }, // path inside the bucket

    /* --- Owner (optional – set when user is logged in) --- */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* --- Access control --- */
    passwordHash: { type: String, default: null }, // bcrypt hash; null = no password
    oneTimeView: { type: Boolean, default: false },
    maxViews: { type: Number, default: null }, // null = unlimited
    viewCount: { type: Number, default: 0 },

    /* --- Expiry --- */
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* TTL index — MongoDB will auto-remove docs once expiresAt is past.
   We ALSO run a cron job to clean up Supabase files. */
uploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Upload", uploadSchema);
