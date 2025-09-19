"use client";

import { ClerkProvider as ClerkProviderComponent } from "@clerk/nextjs";
import { type PropsWithChildren } from "react";

interface ClerkProviderProps extends PropsWithChildren {
  publishableKey: string;
}

export function ClerkProvider({ children, publishableKey }: ClerkProviderProps) {
  return (
    <ClerkProviderComponent publishableKey={publishableKey}>
      {children}
    </ClerkProviderComponent>
  );
}