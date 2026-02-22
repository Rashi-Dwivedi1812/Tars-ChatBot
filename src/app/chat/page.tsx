export default function ChatHomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400&display=swap');

        .chat-home {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .chat-home-inner {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .chat-home-icon {
          width: 64px; height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #7c3aed33, #0ea5e933);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
        }
        .chat-home-icon svg {
          width: 28px; height: 28px;
          stroke: rgba(255,255,255,0.3);
          fill: none; stroke-width: 1.5;
          stroke-linecap: round; stroke-linejoin: round;
        }

        .chat-home-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem; font-weight: 700;
          color: rgba(255,255,255,0.5);
          letter-spacing: -0.02em;
        }

        .chat-home-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.2);
          line-height: 1.6;
          max-width: 220px;
        }

        .chat-home-divider {
          width: 32px; height: 1px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
        }
      `}</style>

      <div className="chat-home">
        <div className="chat-home-inner">
          <div className="chat-home-icon">
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="chat-home-divider" />
          <h2 className="chat-home-title">No Conversation Selected</h2>
          <p className="chat-home-sub">Select a conversation from the sidebar to start chatting.</p>
        </div>
      </div>
    </>
  );
}