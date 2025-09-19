import { SignUp, ClerkLoaded, ClerkLoading, AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default async function Page({
  params,
}: {
  params: Promise<{ rest?: string[] }>;
}) {
  // Check if this is an SSO callback route
  const { rest } = await params;
  const isSSOCallback = rest?.[0] === "sso-callback";

  if (isSSOCallback) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClerkLoaded>
          <AuthenticateWithRedirectCallback />
        </ClerkLoaded>
        <ClerkLoading>
          <p>Completing sign up...</p>
        </ClerkLoading>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp path="/sign-up" afterSignUpUrl="/" afterSignInUrl="/" />
    </div>
  );
}