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
    conversationId ? { conversationId: conversationId as any } : "skip"
  );
  const users = useQuery(api.users.getUsers, {});
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId: conversationId as any } : "skip"
  );
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId ? { conversationId: conversationId as any } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const updateTyping = useMutation(api.typing.updateTyping);
  const markAsRead = useMutation(api.conversations.markAsRead);

  useEffect(() => {
    if (!currentUser || !conversationId) return;
    markAsRead({ conversationId: conversationId as any, userId: currentUser._id });
  }, [conversationId, currentUser, markAsRead]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setIsAtBottom(atBottom);
      if (atBottom) setShowNewMessageButton(false);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!messages || !scrollRef.current) return;
    if (isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } else {
      setShowNewMessageButton(true);
    }
  }, [messages]);

  if (!messages || !currentUser || !users) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-spinner" />
          <span>Loading conversation…</span>
        </div>
      </>
    );
  }

  function formatMessageTime(timestamp: number) {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const isSameYear = messageDate.getFullYear() === now.getFullYear();
    const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
    if (isToday) return timeFormatter.format(messageDate);
    const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
    if (isSameYear) return `${dateFormatter.format(messageDate)}, ${timeFormatter.format(messageDate)}`;
    const fullFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    return fullFormatter.format(messageDate);
  }

  return (
    <>
      <style>{styles}</style>
      <div className="chat-root">
        <div className="chat-shell">
          {/* Header */}
          {conversation && (
            <div className="chat-header">
              <div className="header-avatar">
                {conversation.isGroup ? "👥" : "💬"}
              </div>
              <div className="header-info">
                {conversation.isGroup ? (
                  <>
                    <h2 className="header-name">{conversation.name || "Unnamed Group"}</h2>
                    <p className="header-sub">{conversation.members.length} members</p>
                  </>
                ) : (
                  (() => {
                    const otherMemberId = conversation.members.find((id: any) => id !== currentUser._id);
                    const otherUser = users.find((u) => u._id === otherMemberId);
                    return (
                      <>
                        <h2 className="header-name">{otherUser?.name || "Chat"}</h2>
                        <p className="header-sub">Active now</p>
                      </>
                    );
                  })()
                )}
              </div>
              <div className="header-dot" />
            </div>
          )}

          {/* Messages area */}
          <div className="messages-wrapper">
            <div ref={scrollRef} className="messages-scroll">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <p className="empty-title">No messages yet</p>
                  <p className="empty-sub">Start the conversation.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === currentUser._id;
                  const reactions = m.reactions ?? [];
                  const sender = users.find((u) => u._id === m.senderId);
                  const isGroup = conversation?.isGroup;
                  return (
                    <div key={m._id} className={`msg-row ${isMe ? "msg-row--me" : "msg-row--them"}`}>
                      {isGroup && !isMe && (
                        <div className="sender-avatar" title={sender?.name}>
                          {sender?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className="msg-group">
                        {isGroup && !isMe && (
                          <span className="sender-name">{sender?.name ?? "Unknown"}</span>
                        )}
                        {/* Bubble */}
                        <div className={`bubble ${isMe ? "bubble--me" : "bubble--them"}`}>
                          {m.isDeleted ? (
                            <span className="deleted-text">This message was deleted</span>
                          ) : (
                            m.body
                          )}
                          {isMe && !m.isDeleted && (
                            <button
                              onClick={() => deleteMessage({ messageId: m._id, userId: currentUser._id })}
                              className="delete-btn"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="msg-time">{formatMessageTime(m._creationTime)}</span>

                        {/* Reaction Display */}
                        {reactions.length > 0 && (
                          <div className="reaction-display">
                            {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => {
                              const count = reactions.filter((r) => r.emoji === emoji).length;
                              if (count === 0) return null;
                              const reactedByMe = reactions.some(
                                (r) => r.userId === currentUser._id && r.emoji === emoji
                              );
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction({ messageId: m._id, userId: currentUser._id, emoji })}
                                  className={`reaction-pill ${reactedByMe ? "reaction-pill--active" : ""}`}
                                >
                                  {emoji} {count}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Hover Emoji Bar */}
                        {!m.isDeleted && (
                          <div className="emoji-bar">
                            {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction({ messageId: m._id, userId: currentUser._id, emoji })}
                                className="emoji-btn"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  setShowNewMessageButton(false);
                }}
                className="new-msg-btn"
              >
                ↓ New messages
              </button>
            )}
          </div>

          {/* Typing Indicator */}
          {typingUsers &&
            typingUsers
              .filter((t) => t.userId !== currentUser._id)
              .map((t) => {
                const typingUser = users.find((u) => u._id === t.userId);
                return (
                  <div key={t.userId} className="typing-indicator">
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                    <span>{typingUser?.name} is typing</span>
                  </div>
                );
              })}

          {/* Input */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!message.trim()) return;
              await sendMessage({ conversationId: conversationId as any, senderId: currentUser._id, body: message });
              setMessage("");
            }}
            className="input-bar"
          >
            <input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (currentUser) {
                  updateTyping({ conversationId: conversationId as any, userId: currentUser._id });
                }
              }}
              placeholder="Type a message…"
              className="msg-input"
            />
            <button type="submit" className="send-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .chat-root {
    font-family: 'DM Sans', sans-serif;
    height: 100%;
    width: 100%;
    background: transparent;
    display: flex;
    position: relative;
    overflow: hidden;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    pointer-events: none;
    animation: drift 8s ease-in-out infinite alternate;
  }
  .orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, #5b21b6, transparent 70%);
    top: -120px; left: -120px;
  }
  .orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #0ea5e9, transparent 70%);
    bottom: -100px; right: -100px;
    animation-delay: -4s;
  }
  @keyframes drift {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(24px,16px) scale(1.06); }
  }

  .grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 56px 56px;
    pointer-events: none;
  }

  /* Shell */
  .chat-shell {
    position: relative; z-index: 10;
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    background: transparent;
  }

  /* Header */
  .chat-header {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.02);
  }
  .header-avatar {
    width: 42px; height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(124,58,237,0.35);
  }
  .header-info { flex: 1; }
  .header-name {
    font-family: 'Syne', sans-serif;
    font-size: 1rem; font-weight: 700;
    color: #fff; letter-spacing: -0.01em;
  }
  .header-sub { font-size: 0.75rem; color: rgba(255,255,255,0.35); margin-top: 1px; }
  .header-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    flex-shrink: 0;
  }

  /* Messages */
  .messages-wrapper {
    flex: 1; position: relative; overflow: hidden;
  }
  .messages-scroll {
    height: 100%; overflow-y: auto;
    padding: 24px 20px;
    display: flex; flex-direction: column; gap: 6px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  .messages-scroll::-webkit-scrollbar { width: 4px; }
  .messages-scroll::-webkit-scrollbar-track { background: transparent; }
  .messages-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  /* Empty state */
  .empty-state {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; height: 100%; padding-top: 80px;
  }
  .empty-icon { font-size: 2.5rem; }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; color: rgba(255,255,255,0.6); font-weight: 700; }
  .empty-sub { font-size: 0.85rem; color: rgba(255,255,255,0.3); }

  /* Message rows */
  .msg-row {
    display: flex;
    animation: msgIn 0.25s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .msg-row--me { justify-content: flex-end; }
  .msg-row--them { justify-content: flex-start; align-items: flex-end; }

  /* Group chat sender avatar */
  .sender-avatar {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed55, #0ea5e955);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.8);
    align-self: flex-end;
    margin-bottom: 20px;
  }

  /* Sender name label */
  .sender-name {
    font-size: 0.7rem; font-weight: 600;
    color: rgba(255,255,255,0.4);
    padding: 0 4px; margin-bottom: 3px;
    letter-spacing: 0.01em;
  }

  .msg-group {
    display: flex; flex-direction: column;
    max-width: 68%;
    position: relative;
  }
  .msg-row--me .msg-group { align-items: flex-end; }
  .msg-row--them .msg-group { align-items: flex-start; }

  /* Bubble */
  .bubble {
    position: relative;
    padding: 10px 16px;
    border-radius: 18px;
    font-size: 0.9rem;
    line-height: 1.5;
    word-break: break-word;
  }
  .bubble--me {
    background: linear-gradient(135deg, #7c3aed, #0ea5e9);
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 4px 16px rgba(124,58,237,0.3);
  }
  .bubble--them {
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.85);
    border: 1px solid rgba(255,255,255,0.08);
    border-bottom-left-radius: 4px;
  }

  .deleted-text { font-style: italic; color: rgba(255,255,255,0.3); font-size: 0.85rem; }

  /* Delete button */
  .delete-btn {
    position: absolute; top: -8px; right: -8px;
    display: none;
    width: 20px; height: 20px;
    background: #ef4444;
    color: #fff; border: none;
    border-radius: 50%; cursor: pointer;
    font-size: 0.6rem;
    align-items: center; justify-content: center;
    transition: transform 0.15s;
  }
  .bubble:hover .delete-btn { display: flex; }
  .delete-btn:hover { transform: scale(1.1); }

  /* Timestamp */
  .msg-time {
    font-size: 0.68rem;
    color: rgba(255,255,255,0.25);
    margin-top: 4px;
    padding: 0 4px;
  }

  /* Reaction display */
  .reaction-display {
    display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;
  }
  .reaction-pill {
    padding: 3px 10px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    font-size: 0.78rem;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
  }
  .reaction-pill:hover { background: rgba(255,255,255,0.12); transform: scale(1.05); }
  .reaction-pill--active {
    background: rgba(124,58,237,0.35);
    border-color: rgba(124,58,237,0.5);
  }

  /* Emoji hover bar */
  .emoji-bar {
    display: none;
    gap: 4px; margin-top: 4px; padding: 4px 8px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px;
    backdrop-filter: blur(8px);
  }
  .msg-group:hover .emoji-bar { display: flex; }
  .emoji-btn {
    background: none; border: none; cursor: pointer;
    font-size: 1rem;
    transition: transform 0.15s;
    padding: 0 2px;
  }
  .emoji-btn:hover { transform: scale(1.3); }

  /* New messages button */
  .new-msg-btn {
    position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, #7c3aed, #0ea5e9);
    color: #fff; border: none;
    padding: 8px 20px; border-radius: 100px;
    font-size: 0.8rem; font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .new-msg-btn:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 0 8px 28px rgba(124,58,237,0.5); }

  /* Typing indicator */
  .typing-indicator {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 24px;
    font-size: 0.78rem; color: rgba(255,255,255,0.35);
  }
  .typing-dots {
    display: flex; gap: 3px; align-items: center;
  }
  .typing-dots span {
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(255,255,255,0.3);
    animation: bounce 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%,60%,100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }

  /* Input bar */
  .input-bar {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.02);
  }
  .msg-input {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 12px 18px;
    color: #fff;
    font-size: 0.9rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .msg-input::placeholder { color: rgba(255,255,255,0.25); }
  .msg-input:focus {
    border-color: rgba(124,58,237,0.5);
    background: rgba(255,255,255,0.08);
  }
  .send-btn {
    width: 44px; height: 44px; flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed, #0ea5e9);
    border: none; border-radius: 12px;
    color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(124,58,237,0.35);
  }
  .send-btn svg { width: 18px; height: 18px; }
  .send-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.5); }
  .send-btn:active { transform: translateY(0); }

  /* Loading */
  .loading-screen {
    height: 100%; width: 100%; background: transparent;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; color: rgba(255,255,255,0.4);
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
  }
  .loading-spinner {
    width: 36px; height: 36px;
    border: 2px solid rgba(255,255,255,0.08);
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;