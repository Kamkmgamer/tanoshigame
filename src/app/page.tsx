import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  if (process.env.NODE_ENV !== "production") {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f9ffd9] text-black p-4">
        hello and welcome to tanoshigame!<br />
        <br />
        <Link
          className="text-white bg-center padding-1 bg-pink-900 hover:bg-pink-700/20 rounded-md p-2 "
          href="https://tanoshigame.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit tanoshigame.vercel.app!
        </Link>
        <br />
      </main>
    </HydrateClient>
  );
}
