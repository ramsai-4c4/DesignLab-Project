const Upload = require("../models/Upload");
const { deleteFile } = require("../utils/storage");
const cron = require("node-cron");

/**
 * Runs every minute.
 * Finds expired uploads that still have Supabase files and deletes them,
 * then removes the MongoDB document (in case TTL hasn't kicked in yet).
 */
function startCleanupJob() {
  cron.schedule("* * * * *", async () => {
    try {
      const expired = await Upload.find({
        expiresAt: { $lte: new Date() },
      });

      for (const doc of expired) {
        if (doc.supabasePath) {
          await deleteFile(doc.supabasePath);
        }
        await Upload.findByIdAndDelete(doc._id);
      }

      if (expired.length > 0) {
        console.log(`🧹 Cleaned up ${expired.length} expired upload(s)`);
      }
    } catch (err) {
      console.error("Cleanup job error:", err.message);
    }
  });

  console.log("⏰ Cleanup cron job started (every 1 min)");
}

module.exports = startCleanupJob;
