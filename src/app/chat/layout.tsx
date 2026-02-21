"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const onlineUsers = useQuery(api.presence.getOnlineUsers);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );

  const updatePresence = useMutation(
  api.presence.updatePresence
);

useEffect(() => {
  if (!currentUser) return;

  const interval = setInterval(() => {
    updatePresence({ userId: currentUser._id });
  }, 10000); // every 10 sec

  return () => clearInterval(interval);
}, [currentUser, updatePresence]);

  const allUsers = useQuery(api.users.getUsers, {
  search: undefined,
});

  const conversations = useQuery(
    api.conversations.getSidebarConversations,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const createConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  if (!currentUser || !conversations || !allUsers) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  // Filter users (exclude yourself)
  const filteredUsers = allUsers.filter(
    (u) =>
      u.clerkId !== user?.id &&
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  const getConversationTitle = (conv: any) => {
    if (conv.isGroup) {
      return conv.name || "Unnamed Group";
    }

    const otherMemberId = conv.members.find(
      (id: any) => id !== currentUser._id
    );

    const otherUser = allUsers.find(
      (u) => u._id === otherMemberId
    );

    return otherUser?.name || "Unknown User";
  };

  return (
    <div className="h-screen flex bg-black text-white">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 p-4 overflow-y-auto">
        
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700 text-white"
        />

        {/* Search Results */}
        {search && (
          <div className="mb-6">
            <h3 className="text-sm text-gray-400 mb-2">
              Users
            </h3>

            {filteredUsers.length === 0 && (
  <div className="text-center text-gray-500 text-sm py-2">
    No users found matching "{search}"
  </div>
)}

            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  onClick={async () => {
                    const conversationId =
                      await createConversation({
                        userA: currentUser._id,
                        userB: u._id,
                      });

                    setSearch("");
                    router.push(`/chat/${conversationId}`);
                  }}
                  className="p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                >
                  {u.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversations */}
        <h2 className="text-xl font-semibold mb-4">
          Conversations
        </h2>

        {conversations.length === 0 && (
  <div className="text-center mt-6 text-gray-400">
    <p className="text-lg mb-1">No conversations yet 👋</p>
    <p className="text-sm">
      Search for a user above to start chatting.
    </p>
  </div>
)}

        <div className="space-y-2">
          {conversations.map((conv: any) => {
            const isActive =
              pathname === `/chat/${conv._id}`;

            const lastMessageText =
              conv.lastMessage?.body || "No messages yet";

            const isMine =
              conv.lastMessage?.senderId === currentUser._id;

            return (
              <div
  key={conv._id}
  onClick={() =>
    router.push(`/chat/${conv._id}`)
  }
  className={`p-3 rounded cursor-pointer ${
    isActive
      ? "bg-blue-600"
      : "bg-gray-800 hover:bg-gray-700"
  }`}
>
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
  <p className="font-medium truncate">
    {getConversationTitle(conv)}
  </p>

  {!conv.isGroup && (() => {
    const otherMemberId = conv.members.find(
      (id: any) => id !== currentUser._id
    );

    const isOnline = onlineUsers?.some(
      (p: any) => p.userId === otherMemberId
    );

    return (
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline ? "bg-green-500" : "bg-gray-500"
        }`}
      />
    );
  })()}
</div>

    {conv.unreadCount > 0 && (
      <span className="bg-red-600 text-xs px-2 py-1 rounded-full">
        {conv.unreadCount}
      </span>
    )}
  </div>

  <p className="text-xs text-gray-300 truncate">
    {conv.lastMessage
      ? `${isMine ? "You: " : ""}${lastMessageText}`
      : "No messages yet"}
  </p>
</div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}