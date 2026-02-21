import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, { conversationId, userId }) => {
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    const record = existing.find(
      (t) => t.userId === userId
    );

    if (record) {
      await ctx.db.patch(record._id, {
        expiresAt: Date.now() + 2000,
      });
    } else {
      await ctx.db.insert("typing", {
        conversationId,
        userId,
        expiresAt: Date.now() + 2000,
      });
    }
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const now = Date.now();

    const typingUsers = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    return typingUsers.filter(
      (t) => t.expiresAt > now
    );
  },
});