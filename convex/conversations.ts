import { mutation,query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
  args: {
    userA: v.id("users"),
    userB: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const existing = conversations.find(
      (c) =>
        !c.isGroup &&
        c.members.length === 2 &&
        c.members.includes(args.userA) &&
        c.members.includes(args.userB)
    );

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("conversations", {
      isGroup: false,
      members: [args.userA, args.userB],
    });
  },
});

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    return conversations.filter((conv) =>
      conv.members.includes(userId)
    );
  },
});

export const getSidebarConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const userConversations = conversations.filter((conv) =>
      conv.members.includes(userId)
    );

    const result = [];

    for (const conv of userConversations) {
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conv._id)
        )
        .order("desc")
        .first();

      const lastReadTime =
        conv.lastRead?.[userId] || 0;

      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conv._id)
        )
        .collect();

      const unreadCount = unreadMessages.filter(
        (m) =>
          m.senderId !== userId &&
          m._creationTime > lastReadTime
      ).length;

      result.push({
        ...conv,
        lastMessage,
        unreadCount,
      });
    }

    return result;
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, { conversationId, userId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return;

    const updatedLastRead = {
      ...(conversation.lastRead || {}),
      [userId]: Date.now(),
    };

    await ctx.db.patch(conversationId, {
      lastRead: updatedLastRead,
    });
  },
});

export const getConversationById = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    return await ctx.db.get(conversationId);
  },
});

export const createGroupConversation = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, { name, memberIds }) => {
    if (memberIds.length < 2) {
      throw new Error("Group must have at least 2 members");
    }

    return await ctx.db.insert("conversations", {
      isGroup: true,
      name,
      members: memberIds,
      unreadCounts: memberIds.map((id) => ({
        userId: id,
        count: 0,
      })),
    });
  },
});