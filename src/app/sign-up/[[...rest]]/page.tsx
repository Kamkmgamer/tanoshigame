import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4 py-16">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  );
}