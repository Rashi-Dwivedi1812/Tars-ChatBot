# 🚀 Tars Chat – Real-Time Full Stack Chat Application

A modern real-time chat application built using **Next.js, Convex, Clerk, and Tailwind CSS**.  
Supports one-to-one chat, group conversations, reactions, typing indicators, presence detection, and smart UX enhancements.

🔗 Live Demo: https://tars-chat-bot.vercel.app  
🔗 GitHub Repo: https://github.com/Rashi-Dwivedi1812/Tars-ChatBot

---

## ✨ Features

### 💬 Core Messaging
- Real-time messaging using Convex
- One-to-one private conversations
- Group chat support with custom group names
- Message timestamps (smart formatted: Today / Date / Year)

### 👥 Group Conversations
- Create group by selecting multiple users
- Custom group name
- Real-time sync for all members
- Member count shown in sidebar

### 🟢 Presence & Typing
- Live Online/Offline indicator
- Real-time presence updates
- Typing indicator
- Auto read-receipts (mark as read)

### 👍 Message Interactions
- Emoji reactions (👍 ❤️ 😂 😮 😢)
- Toggle reaction (add/remove)
- Reaction count display
- Soft delete messages
- "This message was deleted" state

### 🧠 Smart UX
- Smart auto-scroll
- “New Messages” floating button
- Sidebar last message preview
- Unread message badge
- Search users by name
- Empty states for:
  - No conversations
  - No messages
  - No search results
- Skeleton loading states
- Error handling with retry support

---

## 🏗 Tech Stack

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS
- TypeScript

### Backend
- Convex (Database + Realtime Backend)

### Authentication
- Clerk (Production setup)

### Deployment
- Vercel (Frontend)
- Convex Cloud (Backend)

---

## 📂 Project Structure
```bash
src/
│
├── app/
│ ├── chat/
│ │ ├── [conversationId]/
│ │ │ └── page.tsx
│ │ └── layout.tsx
│ └── page.tsx
│
├── convex/
│ ├── users.ts
│ ├── messages.ts
│ ├── conversations.ts
│ ├── presence.ts
│ ├── typing.ts
│ └── schema.ts
```

---

## 🔐 Environment Variables

### Vercel Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_*****
CLERK_SECRET_KEY=sk_live_*****
NEXT_PUBLIC_CONVEX_URL=https://your-production.convex.cloud
```

## 🧪 Running Locally
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Rashi-Dwivedi1812/Tars-ChatBot.git
cd Tars-ChatBot
```
### 2️⃣ Install Dependencies
```bash
npm install
```
### 3️⃣ Start Convex Dev
```bash
npx convex dev
```
### 4️⃣ Start Next.js
```bash
npm run dev
```
## 🚀 Deployment
Frontend
Deployed on Vercel
```bash
vercel --prod
```
Backend
```bash
npx convex deploy
```
Production Convex URL configured in Vercel environment variables.

---

## 🧠 Key Engineering Decisions
- Used Convex for real-time database and serverless backend
- Implemented soft delete instead of hard delete for message history integrity
- Designed schema to support: Reactions array, Presence tracking, Group metadata
- Smart scroll logic prevents jump during new message
- Optimized sidebar rendering for performance
- Production-ready authentication via Clerk live keys

## 🛡 Error Handling Strategy
- Graceful UI fallback on loading
- Client-side error boundaries
- Network failure detection
- Retry option for failed message send
- Strict schema validation in Convex

## 📊 Scalability Considerations
- Indexed conversations for efficient lookup
- Presence polling optimized
- Reaction toggling designed with idempotent logic
- Clean separation of concerns between: UI, Mutations, Queries, Auth layer

---

## 👩‍💻 Author
Rashi Dwivedi
- GitHub: https://github.com/Rashi-Dwivedi1812
- LinkedIn: [rashi-dwivedi-796032339](https://www.linkedin.com/in/rashi-dwivedi-796032339/)

## 📄 License
This project is created for educational and internship submission purposes.

---
