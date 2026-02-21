import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updatePresence = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) =>
        q.eq("userId", userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        userId,
        lastSeen: Date.now(),
      });
    }
  },
});

export const getOnlineUsers = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("presence").collect();

    const now = Date.now();

    return all.filter(
      (p) => now - p.lastSeen < 20000 // 20 seconds threshold
    );
  },
});