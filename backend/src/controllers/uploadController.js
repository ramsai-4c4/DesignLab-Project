const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const Upload = require("../models/Upload");
const { uploadFile, getSignedUrl, deleteFile } = require("../utils/storage");

const DEFAULT_EXPIRY_MINUTES = 10;

/* Blocked file extensions (security) */
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".msi", ".scr", ".pif",
  ".com", ".vbs", ".vbe", ".js", ".jse", ".ws",
  ".wsf", ".wsc", ".wsh", ".ps1", ".ps2", ".reg",
  ".inf", ".lnk", ".dll", ".sys",
];

function isBlockedFileType(filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return BLOCKED_EXTENSIONS.includes(ext);
}

/* ──────────────────────────── CREATE ──────────────────────────── */

exports.createUpload = async (req, res) => {
  try {
    const { textContent, expiresIn, password, oneTimeView, maxViews } = req.body;
    const file = req.file; // multer

    /* At least one of text or file is required */
    if (!textContent && !file) {
      return res.status(400).json({ error: "Provide either text content or a file." });
    }
    if (textContent && file) {
      return res.status(400).json({ error: "Upload either text or a file, not both." });
    }

    /* File type validation */
    if (file && isBlockedFileType(file.originalname)) {
      return res.status(400).json({ error: "This file type is not allowed for security reasons." });
    }

    const slug = nanoid(12); // 12-char unique slug

    /* Compute expiry date */
    let expiresAt;
    if (expiresIn) {
      /* expiresIn = number of minutes from now */
      const mins = parseInt(expiresIn, 10);
      if (isNaN(mins) || mins < 1) {
        return res.status(400).json({ error: "expiresIn must be a positive number (minutes)." });
      }
      expiresAt = new Date(Date.now() + mins * 60 * 1000);
    } else {
      expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60 * 1000);
    }

    /* Optional password */
    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    /* Build document */
    const doc = {
      slug,
      expiresAt,
      passwordHash,
      oneTimeView: oneTimeView === "true" || oneTimeView === true,
      maxViews: maxViews ? parseInt(maxViews, 10) || null : null,
      viewCount: 0,
      userId: req.user ? req.user._id : null,
    };

    if (textContent) {
      doc.type = "text";
      doc.textContent = textContent;
    } else {
      /* Upload file to Supabase */
      const remotePath = `${slug}/${file.originalname}`;
      await uploadFile(file.buffer, remotePath, file.mimetype);

      doc.type = "file";
      doc.fileName = file.originalname;
      doc.fileMimeType = file.mimetype;
      doc.fileSize = file.size;
      doc.supabasePath = remotePath;
    }

    const upload = await Upload.create(doc);

    return res.status(201).json({
      slug: upload.slug,
      type: upload.type,
      expiresAt: upload.expiresAt,
      oneTimeView: upload.oneTimeView,
      maxViews: upload.maxViews,
      hasPassword: !!upload.passwordHash,
    });
  } catch (err) {
    console.error("createUpload error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/* ──────────────────────────── GET META ─────────────────────────── */

exports.getMeta = async (req, res) => {
  try {
    const { slug } = req.params;
    const upload = await Upload.findOne({ slug });

    if (!upload) {
      return res.status(403).json({ error: "Content not found or link is invalid." });
    }

    if (new Date() > upload.expiresAt) {
      return res.status(410).json({ error: "This link has expired." });
    }

    /* Check if current user is the owner */
    const isOwner =
      req.user && upload.userId && req.user._id.toString() === upload.userId.toString();

    return res.json({
      type: upload.type,
      hasPassword: !!upload.passwordHash,
      oneTimeView: upload.oneTimeView,
      maxViews: upload.maxViews,
      viewCount: upload.viewCount,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      expiresAt: upload.expiresAt,
      createdAt: upload.createdAt,
      isOwner,
    });
  } catch (err) {
    console.error("getMeta error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/* ──────────────────────────── VIEW / DOWNLOAD ──────────────────── */

exports.viewContent = async (req, res) => {
  try {
    const { slug } = req.params;
    const { password } = req.body; // sent as JSON for POST

    const upload = await Upload.findOne({ slug });

    if (!upload) {
      return res.status(403).json({ error: "Content not found or link is invalid." });
    }

    /* Expiry check */
    if (new Date() > upload.expiresAt) {
      return res.status(410).json({ error: "This link has expired." });
    }

    /* Max-views check */
    if (upload.maxViews !== null && upload.viewCount >= upload.maxViews) {
      return res.status(410).json({ error: "This link has reached its maximum view count." });
    }

    /* Password check */
    if (upload.passwordHash) {
      if (!password) {
        return res.status(401).json({ error: "Password required.", needsPassword: true });
      }
      const ok = await bcrypt.compare(password, upload.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: "Incorrect password.", needsPassword: true });
      }
    }

    /* Increment view count */
    upload.viewCount += 1;
    await upload.save();

    /* Build response */
    const payload = {
      type: upload.type,
      viewCount: upload.viewCount,
      maxViews: upload.maxViews,
      oneTimeView: upload.oneTimeView,
      expiresAt: upload.expiresAt,
    };

    if (upload.type === "text") {
      payload.textContent = upload.textContent;
    } else {
      /* Generate a signed download URL */
      const signedUrl = await getSignedUrl(upload.supabasePath, 120);
      payload.downloadUrl = signedUrl;
      payload.fileName = upload.fileName;
      payload.fileMimeType = upload.fileMimeType;
      payload.fileSize = upload.fileSize;
    }

    /* Send the response immediately so the client gets the content */
    res.json(payload);

    /* One-time view: clean up AFTER the response has been sent */
    if (upload.oneTimeView) {
      try {
        if (upload.supabasePath) await deleteFile(upload.supabasePath);
        await Upload.findByIdAndDelete(upload._id);
        console.log(`🔥 One-time upload ${upload.slug} burned after reading.`);
      } catch (cleanupErr) {
        console.error("One-time view cleanup error:", cleanupErr.message);
      }
    }

    return;
  } catch (err) {
    console.error("viewContent error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/* ──────────────────────────── DELETE ───────────────────────────── */

exports.deleteUpload = async (req, res) => {
  try {
    const { slug } = req.params;
    const upload = await Upload.findOne({ slug });

    if (!upload) {
      return res.status(403).json({ error: "Content not found or link is invalid." });
    }

    /* Only the uploader (owner) can delete an upload. Anonymous uploads cannot be deleted. */
    if (!upload.userId) {
      return res.status(403).json({ error: "Only the uploader can delete this upload." });
    }

    if (!req.user || req.user._id.toString() !== upload.userId.toString()) {
      return res.status(403).json({ error: "Only the uploader can delete this upload." });
    }

    if (upload.supabasePath) {
      await deleteFile(upload.supabasePath);
    }

    await Upload.findByIdAndDelete(upload._id);
    return res.json({ message: "Upload deleted successfully." });
  } catch (err) {
    console.error("deleteUpload error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/* ──────────────────────── MY UPLOADS (auth) ───────────────────── */

exports.getMyUploads = async (req, res) => {
  try {
    const uploads = await Upload.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("slug type fileName fileSize textContent expiresAt viewCount maxViews oneTimeView createdAt");

    return res.json(
      uploads.map((u) => ({
        slug: u.slug,
        type: u.type,
        fileName: u.fileName,
        fileSize: u.fileSize,
        hasText: !!u.textContent,
        expiresAt: u.expiresAt,
        viewCount: u.viewCount,
        maxViews: u.maxViews,
        oneTimeView: u.oneTimeView,
        createdAt: u.createdAt,
        isExpired: new Date() > u.expiresAt,
      }))
    );
  } catch (err) {
    console.error("getMyUploads error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
