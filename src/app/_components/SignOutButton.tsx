"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export function SignOutButton() {
  return (
    <ClerkSignOutButton redirectUrl="/">
      <button className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded">
        Sign Out
      </button>
    </ClerkSignOutButton>
  );
}