"use client";

import { ClerkProvider as ClerkProviderComponent } from "@clerk/nextjs";
import { type PropsWithChildren } from "react";

export function ClerkProvider({ children }: PropsWithChildren) {
  return (
    <ClerkProviderComponent>
      {children}
    </ClerkProviderComponent>
  );
}