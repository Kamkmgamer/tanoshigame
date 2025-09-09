"use client";

import { SignOutButton } from "@clerk/nextjs";
export function SignOut() {
  return (
    <SignOutButton redirectUrl="/">
      <button className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded">
        Sign Out
      </button>
    </SignOutButton>
  );
}