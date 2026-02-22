import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      body: args.body,
    });
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, { messageId, userId }) => {
    const message = await ctx.db.get(messageId);

    if (!message) return;
    if (message.senderId !== userId) return;

    await ctx.db.patch(messageId, {
      body: "",
      isDeleted: true,
    });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, userId, emoji }) => {
    const message = await ctx.db.get(messageId);
    if (!message) return;

    const reactions = message.reactions || [];

    const existing = reactions.find(
      (r) => r.userId === userId && r.emoji === emoji
    );

    let updatedReactions;

    if (existing) {
      // Remove reaction
      updatedReactions = reactions.filter(
        (r) =>
          !(r.userId === userId && r.emoji === emoji)
      );
    } else {
      // Add reaction
      updatedReactions = [
        ...reactions,
        { userId, emoji },
      ];
    }

    await ctx.db.patch(messageId, {
      reactions: updatedReactions,
    });
  },
});