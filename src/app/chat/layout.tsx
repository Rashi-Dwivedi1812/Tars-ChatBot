"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter, usePathname } from "next/navigation";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [groupName, setGroupName] = useState("");

  const onlineUsers = useQuery(api.presence.getOnlineUsers);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );

  const allUsers = useQuery(api.users.getUsers, { search: undefined });

  const conversations = useQuery(
    api.conversations.getSidebarConversations,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const createConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  const createGroupConversation = useMutation(
    api.conversations.createGroupConversation
  );

  const updatePresence = useMutation(api.presence.updatePresence);

  // Presence heartbeat
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      updatePresence({ userId: currentUser._id });
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser, updatePresence]);

  if (!currentUser || !conversations || !allUsers) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.clerkId !== user?.id &&
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  const getConversationTitle = (conv: any) => {
    if (conv.isGroup) {
      return `${conv.name || "Unnamed Group"} (${
        conv.members.length
      })`;
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
      <div className="w-80 border-r border-gray-800 p-4 overflow-y-auto flex flex-col">
        
        {/* Create Group Button */}
        <button
          onClick={() => setShowGroupModal(true)}
          className="w-full mb-4 bg-green-600 py-2 rounded"
        >
          + Create Group
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700"
        />

        {/* Search Results */}
        {search && (
          <div className="mb-6">
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
            <p>No conversations yet 👋</p>
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
                  <p className="font-medium truncate">
                    {getConversationTitle(conv)}
                  </p>

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
      <div className="flex-1">{children}</div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded w-96">
            <h2 className="text-lg mb-4">
              Create Group
            </h2>

            <input
              placeholder="Group name"
              value={groupName}
              onChange={(e) =>
                setGroupName(e.target.value)
              }
              className="w-full p-2 mb-4 bg-gray-800 rounded"
            />

            <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
              {allUsers
                .filter(
                  (u) =>
                    u._id !== currentUser._id
                )
                .map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(
                        u._id
                      )}
                      onChange={() => {
                        setSelectedUsers(
                          (prev) =>
                            prev.includes(u._id)
                              ? prev.filter(
                                  (id) =>
                                    id !== u._id
                                )
                              : [
                                  ...prev,
                                  u._id,
                                ]
                        );
                      }}
                    />
                    <span>{u.name}</span>
                  </div>
                ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() =>
                  setShowGroupModal(false)
                }
                className="px-4 py-1 bg-gray-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (
                    !groupName ||
                    selectedUsers.length === 0
                  )
                    return;

                  const conversationId =
                    await createGroupConversation({
                      name: groupName,
                      memberIds: [
                        currentUser._id,
                        ...selectedUsers,
                      ],
                    });

                  setShowGroupModal(false);
                  setGroupName("");
                  setSelectedUsers([]);

                  router.push(
                    `/chat/${conversationId}`
                  );
                }}
                className="px-4 py-1 bg-blue-600 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}