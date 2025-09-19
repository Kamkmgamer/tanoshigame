"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export function LeaderboardPage() {
  const [limit, setLimit] = useState(10);
  const topScores = api.score.top.useQuery({ limit });

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#f9ffd9] text-black p-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <Link
            href="/"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full"
          >
            Back to Game
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {[5, 10, 20].map((count) => (
              <button
                key={count}
                className={`px-4 py-2 rounded-full ${
                  limit === count
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => setLimit(count)}
              >
                Top {count}
              </button>
            ))}
          </div>
        </div>

        {topScores.isLoading && <p className="text-center">Loading...</p>}

        {topScores.isError && (
          <p className="text-center text-red-500">
            Error loading leaderboard: {topScores.error.message}
          </p>
        )}

        {topScores.data && topScores.data.length === 0 && (
          <p className="text-center">No scores yet. Be the first to play!</p>
        )}

        {topScores.data && topScores.data.length > 0 && (
          <div className="space-y-3">
            {topScores.data.map((score, index) => (
              <div
                key={score.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 ${
                    index === 0 ? "bg-yellow-400" :
                    index === 1 ? "bg-gray-300" :
                    index === 2 ? "bg-amber-700" : "bg-gray-200"
                  }`}>
                    <span className="font-bold">
                      {index === 0 ? "🥇" :
                       index === 1 ? "🥈" :
                       index === 2 ? "🥉" : index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold">{score.playerName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(score.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold">{score.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}