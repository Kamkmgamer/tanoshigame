import { FlowerBG } from "~/app/_components/FlowerBG";
import { Game } from "~/app/_components/Game";
import { api, HydrateClient } from "~/trpc/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  void api.score.top.prefetch({ limit: 5 });

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f9ffd9] text-black p-4">
        <FlowerBG />
        <Game />
      </main>
    </HydrateClient>
  );
}
