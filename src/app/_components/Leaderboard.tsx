"use client";

import { api } from "~/trpc/react";

type LeaderboardProps = {
  /** Number of scores to display */
  limit?: number;
};

export function Leaderboard({ limit = 10 }: LeaderboardProps = {}) {
  const { data, isLoading, isError } = api.score.top.useQuery({ limit });

  return (
    <div className="mt-8 w-full max-w-md">
      <h3 className="text-xl font-bold mb-4 text-center">Leaderboard</h3>

      {isLoading && <p className="text-center text-gray-600">Loading...</p>}
      {isError && (
        <p className="text-center text-red-500">Failed to load leaderboard.</p>
      )}
      {data && data.length === 0 && !isLoading && (
        <p className="text-center text-gray-600">No scores yet. Be the first!</p>
      )}

      {data && data.length > 0 && (
        <ol className="list-decimal list-inside space-y-1">
          {data.map((score, idx) => (
            <li
              key={score.id}
              className="flex justify-between items-baseline bg-white/60 px-3 py-1 rounded-md"
            >
              <span className="font-semibold">
                {idx + 1}. {score.playerName}
              </span>
              <span className="ml-2 text-amber-800 font-bold">{score.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
