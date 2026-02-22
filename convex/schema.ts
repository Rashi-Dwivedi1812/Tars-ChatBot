import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
  isGroup: v.boolean(),
  name: v.optional(v.string()),
  members: v.array(v.id("users")),
  lastRead: v.optional(
    v.record(v.id("users"), v.number())
  ),
}),

  messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  body: v.string(),
  isDeleted: v.optional(v.boolean()),
  reactions: v.optional(
    v.array(
      v.object({
        userId: v.id("users"),
        emoji: v.string(),
      })
    )
  ),
})
.index("by_conversation", ["conversationId"]),
  
  presence: defineTable({
      userId: v.id("users"),
      lastSeen: v.number(),
    }).index("by_user", ["userId"]),

    typing: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        expiresAt: v.number(),
    })
    .index("by_conversation", ["conversationId"])
});