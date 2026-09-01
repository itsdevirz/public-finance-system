import { Db, ObjectId } from "mongodb";
import { DEFAULT_SECURITY_POLICY } from "./securityPolicy.js";

/**
 * Prunes expired or revoked sessions from active_sessions collection.
 * @param db MongoDB database connection instance
 * @param userId Optional userId filter to prune sessions for a specific user
 * @returns Array of remaining valid active sessions
 */
export async function pruneExpiredSessions(db: Db, userId?: ObjectId | string) {
  try {
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value || DEFAULT_SECURITY_POLICY;
    const idleTimeoutMin = policy.sessionPolicy?.idleTimeoutMinutes || 30;
    const tokenExpiresHours = policy.sessionPolicy?.tokenExpiresInHours || 8;

    const query: any = {};
    if (userId) {
      query.userId = typeof userId === "string" ? new ObjectId(userId) : userId;
    }

    const allSessions = await db.collection("active_sessions").find(query).toArray();
    if (allSessions.length === 0) return [];

    const now = Date.now();
    const expiredIds: ObjectId[] = [];
    const validSessions: any[] = [];

    for (const session of allSessions) {
      // 1. Check if token is in revoked_tokens
      const revoked = await db.collection("revoked_tokens").findOne({ token: session.token });
      if (revoked) {
        expiredIds.push(session._id);
        continue;
      }

      // 🌟 Check for user-specific inactivity timeout
      let effectiveIdleTimeout = idleTimeoutMin;
      if (session.userId) {
        const uId = typeof session.userId === "string" ? new ObjectId(session.userId) : session.userId;
        const userDoc = await db.collection("users").findOne({ _id: uId });
        if (userDoc && typeof userDoc.idleTimeoutMinutes === "number" && userDoc.idleTimeoutMinutes > 0) {
          effectiveIdleTimeout = userDoc.idleTimeoutMinutes;
        }
      }

      // 2. Check idle timeout
      const lastActivityTime = session.lastActivity ? new Date(session.lastActivity).valueOf() : (session.createdAt ? new Date(session.createdAt).valueOf() : now);
      const idleMinutes = (now - lastActivityTime) / (60 * 1000);

      // 3. Check absolute token expiration
      const createdAtTime = session.createdAt ? new Date(session.createdAt).valueOf() : lastActivityTime;
      const ageHours = (now - createdAtTime) / (3600 * 1000);

      if (idleMinutes > effectiveIdleTimeout || ageHours > tokenExpiresHours) {
        expiredIds.push(session._id);
        if (session.token) {
          await db.collection("revoked_tokens").updateOne(
            { token: session.token },
            { $set: { token: session.token, revokedAt: new Date().toISOString(), reason: `انقضای خودکار نشست به دلیل عدم فعالیت (آستانه ${effectiveIdleTimeout} دقیقه)` } },
            { upsert: true }
          );
        }
      } else {
        validSessions.push(session);
      }
    }

    if (expiredIds.length > 0) {
      await db.collection("active_sessions").deleteMany({ _id: { $in: expiredIds } });
    }

    return validSessions;
  } catch (error) {
    console.error("Error in pruneExpiredSessions:", error);
    const query: any = {};
    if (userId) {
      query.userId = typeof userId === "string" ? new ObjectId(userId) : userId;
    }
    return await db.collection("active_sessions").find(query).toArray();
  }
}
