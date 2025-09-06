import { Game } from "~/app/_components/Game";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  if (process.env.NODE_ENV !== "production") {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f9ffd9] text-black p-4">
        <Game />
      </main>
    </HydrateClient>
  );
}
