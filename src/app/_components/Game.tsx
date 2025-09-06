"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Leaderboard } from "./Leaderboard";

export function Game() {
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState("idle"); // idle, playing, gameOver
  const [timeLeft, setTimeLeft] = useState(10);

  const utils = api.useUtils();
  const submitScore = api.score.submit.useMutation({
    onSuccess: () => {
      void utils.score.top.invalidate();
    },
  });

  useEffect(() => {
    if (gameState !== "playing" || timeLeft === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setGameState("gameOver");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleStartGame = () => {
    setScore(0);
    setTimeLeft(10);
    setGameState("playing");
  };

  const handleClick = () => {
    if (gameState === "playing") {
      setScore(score + 1);
    }
  };

  const handleSubmit = () => {
    submitScore.mutate({ playerName, score });
  };

  const handlePlayAgain = () => {
    setGameState("idle");
    setScore(0);
    setPlayerName("");
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-4xl font-bold mb-4 text-gray-800">Clicker Game</h2>

      {gameState === "idle" && (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105"
          onClick={handleStartGame}
        >
          Start Game
        </button>
      )}

      {gameState === "playing" && (
        <div className="flex flex-col items-center">
          <p className="text-2xl mb-4">Time Left: {timeLeft}</p>
          <p className="text-5xl font-bold mb-4">Score: {score}</p>
          <button
            className="w-48 h-48 bg-red-500 hover:bg-red-700 text-white font-bold rounded-full text-3xl transition duration-150 ease-in-out transform active:scale-95"
            onClick={handleClick}
          >
            Click!
          </button>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="flex flex-col items-center">
          <p className="text-3xl font-bold mb-4">Game Over!</p>
          <p className="text-2xl mb-4">Your Score: {score}</p>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 mr-2 text-lg"
            />
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-lg"
              onClick={handleSubmit}
              disabled={submitScore.isPending}
            >
              {submitScore.isPending ? "Submitting..." : "Submit Score"}
            </button>
            {submitScore.isSuccess && <p className="text-green-500 mt-2">Score submitted successfully!</p>}
          </div>
          <button
            className="mt-6 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full text-lg"
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </div>
      )}

      <Leaderboard />
    </div>
  );
}
