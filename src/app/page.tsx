"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignedOut>
        <SignInButton />
      </SignedOut>

      <SignedIn>
  <div className="flex flex-col items-center gap-4">
    <a
      href="/chat"
      className="px-4 py-2 bg-black text-white rounded"
    >
      Go to Chat
    </a>
    <UserButton />
  </div>
</SignedIn>
    </div>
  );
}