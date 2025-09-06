"use client";

import { api } from "~/trpc/react";

export function Leaderboard() {
  const topScores = api.score.top.useQuery({ limit: 5 });

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Leaderboard</h3>
      {topScores.isLoading && <p>Loading...</p>}
      {topScores.data && (
        <ol className="list-decimal list-inside">
          {topScores.data.map((score) => (
            <li key={score.id}>
              {score.playerName}: {score.score}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
