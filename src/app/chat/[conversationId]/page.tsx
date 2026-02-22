"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useQuery(
  api.conversations.getConversationById,
  conversationId
    ? { conversationId: conversationId as any }
    : "skip"
);
  const users = useQuery(api.users.getUsers, {});
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );

  const messages = useQuery(
    api.messages.getMessages,
    conversationId
      ? { conversationId: conversationId as any }
      : "skip"
  );

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId
      ? { conversationId: conversationId as any }
      : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const updateTyping = useMutation(api.typing.updateTyping);
  const markAsRead = useMutation(api.conversations.markAsRead);

  // Mark as read when opening conversation
  useEffect(() => {
    if (!currentUser || !conversationId) return;

    markAsRead({
      conversationId: conversationId as any,
      userId: currentUser._id,
    });
  }, [conversationId, currentUser, markAsRead]);

  // Detect scroll position
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom =
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight <
        50;

      setIsAtBottom(atBottom);
      if (atBottom) setShowNewMessageButton(false);
    };

    container.addEventListener("scroll", handleScroll);
    return () =>
      container.removeEventListener("scroll", handleScroll);
  }, []);

  // Smart auto-scroll
  useEffect(() => {
    if (!messages || !scrollRef.current) return;

    if (isAtBottom) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    } else {
      setShowNewMessageButton(true);
    }
  }, [messages]);

  if (!messages || !currentUser || !users) {
    return (
      <div className="p-6 text-white">Loading...</div>
    );
  }

  function formatMessageTime(timestamp: number) {
    const messageDate = new Date(timestamp);
    const now = new Date();

    const isToday =
      messageDate.toDateString() === now.toDateString();

    const isSameYear =
      messageDate.getFullYear() === now.getFullYear();

    const timeFormatter = new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );

    if (isToday) {
      return timeFormatter.format(messageDate);
    }

    const dateFormatter = new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );

    if (isSameYear) {
      return `${dateFormatter.format(
        messageDate
      )}, ${timeFormatter.format(messageDate)}`;
    }

    const fullFormatter = new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );

    return fullFormatter.format(messageDate);
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-black text-white">
      {/* Conversation Header */}
{conversation && (
  <div className="mb-4 border-b border-gray-800 pb-3">
    {conversation.isGroup ? (
      <>
        <h2 className="text-lg font-semibold">
          {conversation.name || "Unnamed Group"}
        </h2>
        <p className="text-sm text-gray-400">
          {conversation.members.length} members
        </p>
      </>
    ) : (
      (() => {
        const otherMemberId = conversation.members.find(
          (id: any) => id !== currentUser._id
        );

        const otherUser = users.find(
          (u) => u._id === otherMemberId
        );

        return (
          <h2 className="text-lg font-semibold">
            {otherUser?.name || "Chat"}
          </h2>
        );
      })()
    )}
  </div>
)}
      {/* Messages */}
      <div className="relative flex-1">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto space-y-4 pr-2"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-1">
                  No messages yet 💬
                </p>
                <p className="text-sm">
                  Start the conversation.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isMe =
                m.senderId === currentUser._id;
                const reactions = m.reactions ?? [];
              return (
                <div
                  key={m._id}
                  className={`group flex flex-col max-w-xs ${
                    isMe
                      ? "ml-auto items-end"
                      : "items-start"
                  }`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`p-2 rounded relative ${
                      isMe
                        ? "bg-blue-600"
                        : "bg-gray-700"
                    }`}
                  >
                    {m.isDeleted ? (
                      <span className="italic text-gray-400">
                        This message was deleted
                      </span>
                    ) : (
                      m.body
                    )}

                    {isMe && !m.isDeleted && (
                      <button
                        onClick={() =>
                          deleteMessage({
                            messageId: m._id,
                            userId:
                              currentUser._id,
                          })
                        }
                        className="absolute -top-2 -right-2 hidden group-hover:block text-xs bg-red-600 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-400 mt-1">
                    {formatMessageTime(
                      m._creationTime
                    )}
                  </span>

                  {/* Reaction Display */}
                  {reactions.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {[
                          "👍",
                          "❤️",
                          "😂",
                          "😮",
                          "😢",
                        ].map((emoji) => {
                          const count =
                            reactions.filter(
                              (r) =>
                                r.emoji === emoji
                            ).length;

                          if (count === 0)
                            return null;

                          const reactedByMe =
                            reactions.some(
                              (r) =>
                                r.userId ===
                                  currentUser._id &&
                                r.emoji === emoji
                            );

                          return (
                            <button
                              key={emoji}
                              onClick={() =>
                                toggleReaction({
                                  messageId:
                                    m._id,
                                  userId:
                                    currentUser._id,
                                  emoji,
                                })
                              }
                              className={`px-2 py-1 text-sm rounded-full border ${
                                reactedByMe
                                  ? "bg-blue-600 border-blue-400"
                                  : "bg-gray-800 border-gray-600"
                              }`}
                            >
                              {emoji} {count}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* Hover Emoji Bar */}
                  {!m.isDeleted && (
                    <div className="hidden group-hover:flex gap-2 mt-1">
                      {[
                        "👍",
                        "❤️",
                        "😂",
                        "😮",
                        "😢",
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() =>
                            toggleReaction({
                              messageId:
                                m._id,
                              userId:
                                currentUser._id,
                              emoji,
                            })
                          }
                          className="hover:scale-125 transition text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {/* New Message Button */}
        {showNewMessageButton && (
          <button
            onClick={() => {
              if (!scrollRef.current)
                return;
              scrollRef.current.scrollTop =
                scrollRef.current
                  .scrollHeight;
              setShowNewMessageButton(false);
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-sm"
          >
            ↓ New messages
          </button>
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers &&
        typingUsers
          .filter(
            (t) =>
              t.userId !== currentUser._id
          )
          .map((t) => {
            const typingUser = users.find(
              (u) =>
                u._id === t.userId
            );

            return (
              <div
                key={t.userId}
                className="text-sm text-gray-400 mb-2"
              >
                {typingUser?.name} is typing...
              </div>
            );
          })}

      {/* Input */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!message.trim()) return;

          await sendMessage({
            conversationId:
              conversationId as any,
            senderId:
              currentUser._id,
            body: message,
          });

          setMessage("");
        }}
        className="flex gap-2 mt-4"
      >
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);

            if (currentUser) {
              updateTyping({
                conversationId:
                  conversationId as any,
                userId:
                  currentUser._id,
              });
            }
          }}
          placeholder="Type a message..."
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-600"
        />
        <button
          type="submit"
          className="px-4 bg-blue-600 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}