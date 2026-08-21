import { connectDb } from "./db/index.js";
import { signExistingLogs } from "./lib/auditLogger.js";

async function run() {
  try {
    const db = await connectDb();
    const col = db.collection("audit_logs");

    console.log("Initial document count:", await col.countDocuments());

    // Filter to delete automatic background GET read logs
    const deleteFilter = {
      $or: [
        { action: { $regex: "^مشاهده و استعلام:" } },
        { action: { $regex: "^شروع پردازش:" } },
        { method: "GET", eventType: "اتمام تابع / درخواست" },
        { method: "GET", action: { $regex: "پردازش سیستم: ورود کاربر به سامانه" } }
      ]
    };

    const countToDelete = await col.countDocuments(deleteFilter);
    console.log("Automatic background GET logs to delete:", countToDelete);

    const deleteResult = await col.deleteMany(deleteFilter);
    console.log("Deleted count:", deleteResult.deletedCount);

    console.log("Remaining document count:", await col.countDocuments());

    // Re-sign all remaining logs using built-in auditLogger helper
    console.log("Re-signing remaining logs for HMAC SHA-256 integrity...");
    await signExistingLogs();
    console.log("✓ Audit log cleanup and re-signing completed successfully!");

    process.exit(0);
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  }
}

run();
