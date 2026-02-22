"use client";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        /* Ambient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          pointer-events: none;
          animation: drift 8s ease-in-out infinite alternate;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #5b21b6, transparent 70%);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #0ea5e9, transparent 70%);
          bottom: -80px; right: -80px;
          animation-delay: -4s;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #db2777, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -2s;
          opacity: 0.15;
        }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, 20px) scale(1.08); }
        }

        /* Grid texture */
        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Card */
        .card {
          position: relative;
          z-index: 10;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 56px 64px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05) inset,
            0 32px 80px rgba(0,0,0,0.5);
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Logo mark */
        .logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
          margin-bottom: 28px;
          box-shadow: 0 8px 32px rgba(124,58,237,0.4);
        }
        .logo-mark svg {
          width: 32px;
          height: 32px;
          fill: none;
          stroke: #fff;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        h1 {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 10px;
        }
        h1 span {
          background: linear-gradient(90deg, #a78bfa, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.45);
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        /* Sign In button wrapper */
        .signin-wrap {
          display: inline-flex;
        }
        /* Override Clerk SignInButton default to match our style */
        .signin-wrap button,
        .clerk-sign-in-btn {
          padding: 14px 40px;
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(124,58,237,0.35);
        }
        .signin-wrap button:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(124,58,237,0.5);
        }

        /* Signed-in layout */
        .signed-in-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .chat-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 36px;
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
          color: #fff;
          text-decoration: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(124,58,237,0.35);
        }
        .chat-link:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(124,58,237,0.5);
        }
        .chat-link svg {
          width: 16px; height: 16px;
          stroke: #fff; fill: none;
          stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
        }

        .divider {
          width: 40px;
          height: 1px;
          background: rgba(255,255,255,0.12);
        }

        .footer-text {
          position: absolute;
          bottom: 28px;
          left: 0; right: 0;
          text-align: center;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.05em;
          z-index: 10;
        }
      `}</style>

      <div className="home-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-bg" />

        <div className="card">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>

          <h1>Welcome to <span>Tars</span></h1>
          <p className="subtitle">Your intelligent chat assistant, ready to help you think, create, and explore.</p>

          <SignedOut>
            <div className="signin-wrap">
              <SignInButton />
            </div>
          </SignedOut>

          <SignedIn>
            <div className="signed-in-wrap">
              <a href="/chat" className="chat-link">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Go to Chat
              </a>
              <div className="divider" />
              <UserButton />
            </div>
          </SignedIn>
        </div>

        <p className="footer-text">TARS · Powered by AI</p>
      </div>
    </>
  );
}