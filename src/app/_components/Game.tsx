"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function Game() {
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState("");

  const submitScore = api.score.submit.useMutation();
  const topScores = api.score.top.useQuery({ limit: 5 });

  const handleClick = () => {
    setScore(score + 1);
  };

  const handleSubmit = () => {
    submitScore.mutate({ playerName, score });
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Click the Button!</h2>
      <p className="text-xl mb-4">Score: {score}</p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleClick}
      >
        Click me!
      </button>

      <div className="mt-8">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 mr-2"
        />
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSubmit}
          disabled={submitScore.isPending}
        >
          {submitScore.isPending ? "Submitting..." : "Submit Score"}
        </button>
        {submitScore.isSuccess && <p className="text-green-500 mt-2">Score submitted successfully!</p>}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Leaderboard</h3>
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
    </div>
  );
}
