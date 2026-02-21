"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { user } = useUser();
  const [isAtBottom, setIsAtBottom] = useState(true);
const [showNewMessageButton, setShowNewMessageButton] =
  useState(false);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const users = useQuery(api.users.getUsers, {});
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );

  const messages = useQuery(api.messages.getMessages, {
    conversationId: conversationId as any,
  });

  const sendMessage = useMutation(api.messages.sendMessage);

  const typingUsers = useQuery(
  api.typing.getTypingUsers,
  conversationId
    ? { conversationId: conversationId as any }
    : "skip"
);

const updateTyping = useMutation(api.typing.updateTyping);

const markAsRead = useMutation(api.conversations.markAsRead);

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

    if (atBottom) {
      setShowNewMessageButton(false);
    }
  };

  container.addEventListener("scroll", handleScroll);

  return () =>
    container.removeEventListener("scroll", handleScroll);
}, []);

useEffect(() => {
  if (!currentUser || !conversationId) return;

  markAsRead({
    conversationId: conversationId as any,
    userId: currentUser._id,
  });
}, [conversationId, currentUser, markAsRead]);

  // Auto scroll to bottom when messages update
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
    return <div className="p-6">Loading...</div>;
  }

  function formatMessageTime(timestamp: number) {
  const messageDate = new Date(timestamp);
  const now = new Date();

  const isToday =
    messageDate.toDateString() === now.toDateString();

  const isSameYear =
    messageDate.getFullYear() === now.getFullYear();

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) {
    return timeFormatter.format(messageDate);
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  if (isSameYear) {
    return `${dateFormatter.format(messageDate)}, ${timeFormatter.format(
      messageDate
    )}`;
  }

  const fullFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return fullFormatter.format(messageDate);
}

  return (
    <div className="min-h-screen flex flex-col p-6 bg-black text-white">
      {/* Messages */}
      <div className="relative flex-1">
  <div
    ref={scrollRef}
    className="h-full overflow-y-auto space-y-3 pr-2"
  >
    {messages.length === 0 ? (
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-1">No messages yet 💬</p>
          <p className="text-sm">
            Start the conversation by sending a message.
          </p>
        </div>
      </div>
    ) : (
      messages.map((m) => {
        const isMe =
          m.senderId === currentUser._id;

        return (
          <div
            key={m._id}
            className={`flex flex-col max-w-xs ${
              isMe
                ? "ml-auto items-end"
                : "items-start"
            }`}
          >
            <div
              className={`p-2 rounded ${
                isMe
                  ? "bg-blue-600"
                  : "bg-gray-700"
              }`}
            >
              {m.body}
            </div>

            <span className="text-xs text-gray-400 mt-1">
              {formatMessageTime(
                m._creationTime
              )}
            </span>
          </div>
        );
      })
    )}
  </div>

  {/* New Message Button */}
  {showNewMessageButton && (
    <button
      onClick={() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop =
          scrollRef.current.scrollHeight;
        setShowNewMessageButton(false);
      }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-sm"
    >
      ↓ New messages
    </button>
  )}
      </div>

      {/* Input */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!message.trim()) return;

          await sendMessage({
            conversationId: conversationId as any,
            senderId: currentUser._id,
            body: message,
          });

          setMessage("");
        }}
        className="flex gap-2"
      >
        {typingUsers &&
  typingUsers
    .filter((t) => t.userId !== currentUser._id)
    .map((t) => {
      const typingUser = users.find(
        (u) => u._id === t.userId
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
        <input
  value={message}
  onChange={(e) => {
    setMessage(e.target.value);

    if (currentUser) {
      updateTyping({
        conversationId: conversationId as any,
        userId: currentUser._id,
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