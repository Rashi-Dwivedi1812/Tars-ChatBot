export default function ChatHomePage() {
  return (
    <div className="h-full flex items-center justify-center bg-black text-gray-400">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          No Conversation Selected
        </h2>
        <p className="text-sm">
          Select a conversation from the sidebar to start chatting.
        </p>
      </div>
    </div>
  );
}