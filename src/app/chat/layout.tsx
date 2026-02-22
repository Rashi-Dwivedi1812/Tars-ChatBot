"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter, usePathname } from "next/navigation";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [groupName, setGroupName] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const onlineUsers = useQuery(api.presence.getOnlineUsers);
  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip");
  const allUsers = useQuery(api.users.getUsers, { search: undefined });
  const conversations = useQuery(
    api.conversations.getSidebarConversations,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const createConversation = useMutation(api.conversations.getOrCreateConversation);
  const createGroupConversation = useMutation(api.conversations.createGroupConversation);
  const updatePresence = useMutation(api.presence.updatePresence);

  useEffect(() => {
    if (!currentUser) return;
    updatePresence({ userId: currentUser._id });
    const interval = setInterval(() => {
      updatePresence({ userId: currentUser._id });
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close mobile chat when navigating back to /chat root
  useEffect(() => {
    if (pathname === "/chat") setMobileChatOpen(false);
  }, [pathname]);

  if (!currentUser || !conversations || !allUsers) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-spinner" />
          <span>Loading…</span>
        </div>
      </>
    );
  }

  const filteredUsers = allUsers.filter(
    (u) => u.clerkId !== user?.id && u.name.toLowerCase().includes(search.toLowerCase())
  );

  const getConversationTitle = (conv: any) => {
    if (conv.isGroup) return `${conv.name || "Unnamed Group"} (${conv.members.length})`;
    const otherMemberId = conv.members.find((id: any) => id !== currentUser._id);
    const otherUser = allUsers.find((u) => u._id === otherMemberId);
    return otherUser?.name || "Unknown User";
  };

  const handleConversationClick = (convId: string) => {
    router.push(`/chat/${convId}`);
    setMobileChatOpen(true);
  };

  const handleBack = () => {
    setMobileChatOpen(false);
    router.push("/chat");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="layout-root">
        {/* Ambient orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="grid-bg" />

        {/* Sidebar */}
        <aside className={`sidebar ${mobileChatOpen ? "sidebar--hidden" : ""}`}>
          <div className="sidebar-header">
            <div className="brand">
              <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className="brand-name">Tars</span>
            </div>
            <button onClick={() => setShowGroupModal(true)} className="new-group-btn" title="Create Group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </button>
          </div>

          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {search && (
            <div className="search-results">
              {filteredUsers.length === 0 ? (
                <div className="search-empty">No users found for "{search}"</div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    onClick={async () => {
                      const conversationId = await createConversation({ userA: currentUser._id, userB: u._id });
                      setSearch("");
                      handleConversationClick(conversationId as string);
                    }}
                    className="search-user-item"
                  >
                    <div className="user-avatar-sm">{u.name[0]?.toUpperCase()}</div>
                    <span>{u.name}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* All Users */}
          <div className="conv-section-label">People</div>
          <div className="users-list">
            {allUsers
              .filter((u) => u.clerkId !== user?.id)
              .map((u) => {
                const isOnline = onlineUsers?.some((p: any) => p.userId === u._id);
                return (
                  <div
                    key={u._id}
                    onClick={async () => {
                      const conversationId = await createConversation({ userA: currentUser._id, userB: u._id });
                      handleConversationClick(conversationId as string);
                    }}
                    className="user-item"
                  >
                    <div className="user-item-avatar">
                      {u.name[0]?.toUpperCase()}
                      <span className={`online-dot ${isOnline ? "online-dot--on" : "online-dot--off"}`} />
                    </div>
                    <div className="user-item-info">
                      <span className="user-item-name">{u.name}</span>
                      <span className="user-item-status">{isOnline ? "Online" : "Offline"}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="conv-section-label">Conversations</div>

          {conversations.length === 0 ? (
            <div className="conv-empty"><span>No conversations yet 👋</span></div>
          ) : (
            <div className="conv-list">
              {conversations.map((conv: any) => {
                const isActive = pathname === `/chat/${conv._id}`;
                const lastMessageText = conv.lastMessage?.body || "No messages yet";
                const isMine = conv.lastMessage?.senderId === currentUser._id;
                let isOnline = false;
                if (!conv.isGroup && onlineUsers) {
                  const otherMemberId = conv.members.find((id: any) => id !== currentUser._id);
                  isOnline = onlineUsers.some((p: any) => p.userId === otherMemberId);
                }
                const title = getConversationTitle(conv);
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleConversationClick(conv._id)}
                    className={`conv-item ${isActive ? "conv-item--active" : ""}`}
                  >
                    <div className="conv-avatar">
                      {conv.isGroup ? "👥" : title[0]?.toUpperCase()}
                      {!conv.isGroup && (
                        <span className={`online-dot ${isOnline ? "online-dot--on" : "online-dot--off"}`} />
                      )}
                    </div>
                    <div className="conv-info">
                      <div className="conv-top">
                        <span className="conv-name">{title}</span>
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                      <p className="conv-preview">
                        {conv.lastMessage ? `${isMine ? "You: " : ""}${lastMessageText}` : "No messages yet"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Chat Area */}
        <main className={`chat-area ${mobileChatOpen ? "chat-area--open" : ""}`}>
          {/* Mobile-only back button */}
          <button className="mobile-back-btn" onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back</span>
          </button>
          {children}
        </main>

        {/* Group Modal */}
        {showGroupModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">Create Group</h2>
                <button onClick={() => setShowGroupModal(false)} className="modal-close">✕</button>
              </div>
              <input
                placeholder="Group name…"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="modal-input"
              />
              <div className="modal-user-list">
                {allUsers
                  .filter((u) => u._id !== currentUser._id)
                  .map((u) => (
                    <label key={u._id} className="modal-user-row">
                      <div className="user-avatar-sm">{u.name[0]?.toUpperCase()}</div>
                      <span className="modal-user-name">{u.name}</span>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u._id)}
                        onChange={() => {
                          setSelectedUsers((prev) =>
                            prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                          );
                        }}
                        className="modal-checkbox"
                      />
                    </label>
                  ))}
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowGroupModal(false)} className="modal-btn modal-btn--cancel">Cancel</button>
                <button
                  onClick={async () => {
                    if (!groupName || selectedUsers.length === 0) return;
                    const conversationId = await createGroupConversation({
                      name: groupName,
                      memberIds: [currentUser._id, ...selectedUsers],
                    });
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedUsers([]);
                    handleConversationClick(conversationId as string);
                  }}
                  className="modal-btn modal-btn--create"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .layout-root {
    font-family: 'DM Sans', sans-serif;
    height: 100vh; display: flex;
    background: #0a0a0f; color: #fff;
    position: relative; overflow: hidden;
  }

  .orb {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: 0.25; pointer-events: none;
    animation: drift 9s ease-in-out infinite alternate;
  }
  .orb-1 { width: 480px; height: 480px; background: radial-gradient(circle, #5b21b6, transparent 70%); top: -120px; left: -60px; }
  .orb-2 { width: 360px; height: 360px; background: radial-gradient(circle, #0ea5e9, transparent 70%); bottom: -80px; left: 160px; animation-delay: -4s; }
  @keyframes drift {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(20px,14px) scale(1.06); }
  }
  .grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 56px 56px; pointer-events: none;
  }

  /* ── Sidebar ── */
  .sidebar {
    position: relative; z-index: 10;
    width: 300px; flex-shrink: 0;
    display: flex; flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.025);
    backdrop-filter: blur(20px);
    overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
  }

  .sidebar-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 18px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #7c3aed, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(124,58,237,0.4);
  }
  .brand-icon svg { width: 16px; height: 16px; stroke: #fff; }
  .brand-name {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 1.1rem; letter-spacing: -0.02em;
    background: linear-gradient(90deg, #a78bfa, #38bdf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .new-group-btn {
    width: 32px; height: 32px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 9px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, transform 0.15s;
  }
  .new-group-btn svg { width: 15px; height: 15px; stroke: rgba(255,255,255,0.6); }
  .new-group-btn:hover { background: rgba(124,58,237,0.25); transform: scale(1.05); }

  .search-wrap { position: relative; padding: 14px 16px 10px; flex-shrink: 0; }
  .search-icon {
    position: absolute; left: 28px; top: 50%; transform: translateY(-50%);
    width: 14px; height: 14px; stroke: rgba(255,255,255,0.3);
  }
  .search-input {
    width: 100%; padding: 10px 14px 10px 36px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px; color: #fff;
    font-size: 0.85rem; font-family: 'DM Sans', sans-serif;
    outline: none; transition: border-color 0.2s, background 0.2s;
  }
  .search-input::placeholder { color: rgba(255,255,255,0.25); }
  .search-input:focus { border-color: rgba(124,58,237,0.45); background: rgba(255,255,255,0.09); }

  .search-results { padding: 0 12px 10px; flex-shrink: 0; }
  .search-empty { font-size: 0.78rem; color: rgba(255,255,255,0.3); text-align: center; padding: 8px 0; }
  .search-user-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 10px;
    cursor: pointer; transition: background 0.15s;
    font-size: 0.88rem; color: rgba(255,255,255,0.8);
  }
  .search-user-item:hover { background: rgba(255,255,255,0.07); }

  .user-avatar-sm {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed88, #0ea5e988);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 600; color: #fff;
  }

  /* Users list */
  .users-list {
    padding: 2px 10px 8px;
    flex-shrink: 0;
    max-height: 220px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.07) transparent;
  }
  .users-list::-webkit-scrollbar { width: 3px; }
  .users-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

  .user-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 11px;
    cursor: pointer; transition: background 0.15s;
    margin-bottom: 2px;
  }
  .user-item:hover { background: rgba(255,255,255,0.06); }

  .user-item-avatar {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed55, #0ea5e955);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.82rem; font-weight: 700; color: #fff;
    position: relative;
  }

  .user-item-info { flex: 1; min-width: 0; }
  .user-item-name {
    display: block; font-size: 0.85rem; font-weight: 500;
    color: rgba(255,255,255,0.85);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .user-item-status {
    font-size: 0.7rem; color: rgba(255,255,255,0.3);
  }

  .conv-section-label {
    font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: rgba(255,255,255,0.25);
    padding: 8px 18px 6px; flex-shrink: 0;
  }
  .conv-empty {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; color: rgba(255,255,255,0.3);
  }
  .conv-list {
    flex: 1; overflow-y: auto; padding: 4px 10px 12px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.07) transparent;
  }
  .conv-list::-webkit-scrollbar { width: 3px; }
  .conv-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

  .conv-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 10px; border-radius: 12px;
    cursor: pointer; margin-bottom: 2px; transition: background 0.15s;
  }
  .conv-item:hover { background: rgba(255,255,255,0.06); }
  .conv-item--active { background: rgba(124,58,237,0.2) !important; }

  .conv-avatar {
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed55, #0ea5e955);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9rem; font-weight: 700; color: #fff; position: relative;
  }
  .online-dot {
    position: absolute; bottom: -2px; right: -2px;
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid #0a0a0f;
  }
  .online-dot--on { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
  .online-dot--off { background: rgba(255,255,255,0.2); }

  .conv-info { flex: 1; min-width: 0; }
  .conv-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px; }
  .conv-name { font-size: 0.88rem; font-weight: 500; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-preview { font-size: 0.75rem; color: rgba(255,255,255,0.3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .unread-badge {
    flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed, #0ea5e9);
    font-size: 0.65rem; font-weight: 600;
    padding: 2px 7px; border-radius: 100px; color: #fff;
    min-width: 20px; text-align: center;
  }

  /* Chat area */
  .chat-area {
    flex: 1; position: relative; z-index: 10; overflow: hidden;
    display: flex; flex-direction: column;
  }

  /* Mobile back button — hidden on desktop */
  .mobile-back-btn { display: none; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
  }
  .modal {
    background: #13131a; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 28px; width: 380px; max-width: 90vw;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6);
    animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; color: #fff; }
  .modal-close {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(255,255,255,0.07); border: none;
    color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.75rem; transition: background 0.15s;
  }
  .modal-close:hover { background: rgba(239,68,68,0.25); color: #f87171; }

  .modal-input {
    width: 100%; padding: 11px 14px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; color: #fff; font-size: 0.88rem;
    font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 16px; transition: border-color 0.2s;
  }
  .modal-input::placeholder { color: rgba(255,255,255,0.25); }
  .modal-input:focus { border-color: rgba(124,58,237,0.5); }

  .modal-user-list {
    max-height: 180px; overflow-y: auto; margin-bottom: 20px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .modal-user-list::-webkit-scrollbar { width: 3px; }
  .modal-user-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

  .modal-user-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 6px; border-radius: 10px; cursor: pointer; transition: background 0.15s;
  }
  .modal-user-row:hover { background: rgba(255,255,255,0.05); }
  .modal-user-name { flex: 1; font-size: 0.88rem; color: rgba(255,255,255,0.8); }
  .modal-checkbox { width: 16px; height: 16px; accent-color: #7c3aed; cursor: pointer; }

  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .modal-btn {
    padding: 10px 22px; border-radius: 11px; border: none;
    font-size: 0.88rem; font-family: 'DM Sans', sans-serif;
    font-weight: 500; cursor: pointer; transition: opacity 0.2s, transform 0.15s;
  }
  .modal-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .modal-btn--cancel { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
  .modal-btn--create { background: linear-gradient(135deg, #7c3aed, #0ea5e9); color: #fff; box-shadow: 0 4px 16px rgba(124,58,237,0.35); }

  /* Loading */
  .loading-screen {
    min-height: 100vh; background: #0a0a0f;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; color: rgba(255,255,255,0.35);
    font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
  }
  .loading-spinner {
    width: 34px; height: 34px;
    border: 2px solid rgba(255,255,255,0.07);
    border-top-color: #7c3aed; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Mobile (≤ 640px) ── */
  @media (max-width: 640px) {

    /* Sidebar fills full screen by default on mobile */
    .sidebar {
      position: absolute; inset: 0;
      width: 100%; z-index: 20;
      transform: translateX(0);
      border-right: none;
    }

    /* Slide sidebar out when chat is open */
    .sidebar--hidden {
      transform: translateX(-100%);
      pointer-events: none;
    }

    /* Chat area starts off-screen to the right */
    .chat-area {
      position: absolute; inset: 0;
      width: 100%; z-index: 10;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
    }

    /* Slide chat in when open */
    .chat-area--open {
      transform: translateX(0);
    }

    /* Show back button on mobile */
    .mobile-back-btn {
      display: flex; align-items: center; gap: 6px;
      position: absolute; top: 14px; left: 14px; z-index: 30;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; padding: 7px 14px;
      color: rgba(255,255,255,0.75);
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem; font-weight: 500;
      cursor: pointer; transition: background 0.15s;
    }
    .mobile-back-btn svg { width: 14px; height: 14px; stroke: rgba(255,255,255,0.75); }
    .mobile-back-btn:hover { background: rgba(255,255,255,0.12); }
  }
`;