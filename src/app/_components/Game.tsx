"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { Hamster } from "./Hamster";
import { Food } from "./Food";
import { Leaderboard } from "./Leaderboard";

type FallingItem = {
  id: number;
  x: number;
  y: number;
  type: "food" | "jalapeno";
  speed: number;
};

export function Game() {
  // Game state
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerName, setPlayerName] = useState("");
  
  const [, forceRender] = useState(0);

  // Refs
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Game elements
  const hamsterXRef = useRef(0);
  const containerHeightRef = useRef(600);
  const [hamsterX, setHamsterX] = useState(0);
  const [hamsterY, setHamsterY] = useState(500);
  const [hamsterDir, setHamsterDir] = useState<"left" | "right" | "none">("none");
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);

  useEffect(() => {
    const updateDimensions = () => {
      if (!gameAreaRef.current) return;
      const width = gameAreaRef.current.clientWidth;
      const height = gameAreaRef.current.clientHeight;
      containerHeightRef.current = height;
      hamsterXRef.current = width / 2 - 50;
      setHamsterX(hamsterXRef.current);
      setHamsterY(height - 120); // ground 20 + hamster 100
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Sync container height & hamster Y once game area is mounted (after start)
  useEffect(() => {
    if (gameState !== "playing" || !gameAreaRef.current) return;
    const height = gameAreaRef.current.clientHeight;
    containerHeightRef.current = height;
    setHamsterY(height - 120);
  }, [gameState]);
  
  // Refs
  const animationFrameRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const itemCounterRef = useRef<number>(0);
  
  // tRPC
  const utils = api.useUtils();
  // Audio refs
  const munchSoundRef = useRef<HTMLAudioElement | null>(null);
  const hurtSoundRef = useRef<HTMLAudioElement | null>(null);

  const submitScore = api.score.submit.useMutation({
    onSuccess: () => {
      void utils.score.top.invalidate();
    },
  });

  // Handle keyboard input for hamster movement
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      let moved = false;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        hamsterXRef.current = Math.max(0, hamsterXRef.current - 20);
        moved = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        const gameAreaWidth = gameAreaRef.current ? gameAreaRef.current.clientWidth : 800;
        hamsterXRef.current = Math.min(gameAreaWidth - 100, hamsterXRef.current + 20);
        moved = true;
      }
      if (moved) {
        setHamsterDir(e.key === "ArrowLeft" || e.key === "a" || e.key === "A" ? "left" : "right");
      }
      setHamsterX(hamsterXRef.current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Handle pointer/touch input (mobile + desktop)
  useEffect(() => {
    if (gameState !== "playing") return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      hamsterXRef.current = Math.max(0, Math.min(rect.width - 100, relativeX - 50));
      setHamsterDir(relativeX < hamsterXRef.current + 50 ? "left" : "right");
      setHamsterX(hamsterXRef.current);
    };

    const area = gameAreaRef.current;
    area?.addEventListener("pointermove", handlePointerMove);

    // Prevent default scrolling on touch devices while playing
    area?.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

    return () => {
      area?.removeEventListener("pointermove", handlePointerMove);
    };
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = (timestamp: number) => {
      // --- State updates should be based on the previous state ---
      setFallingItems((prevItems: FallingItem[]) => {
        let newItems = prevItems.map((item: FallingItem) => ({
          ...item,
          y: item.y + item.speed,
        })).filter(item => item.y < (containerHeightRef.current || 600));

        // Collision detection
        const hamsterRect = { x: hamsterXRef.current, y: hamsterY, width: 100, height: 100 };
        const collidedItemIds = new Set<number>();

        for (const item of newItems) {
          const itemRect = { x: item.x, y: item.y, width: 80, height: item.type === "food" ? 80 : 100 };

          if (
            hamsterRect.x < itemRect.x + itemRect.width &&
            hamsterRect.x + hamsterRect.width > itemRect.x &&
            hamsterRect.y < itemRect.y + itemRect.height &&
            hamsterRect.y + hamsterRect.height > itemRect.y
          ) {
            collidedItemIds.add(item.id);
            if (item.type === "food") {
              munchSoundRef.current?.play().catch((err) => {
    console.error("Failed to play munch sound", err);
  });
              scoreRef.current++;
            } else {
              hurtSoundRef.current?.play().catch((err) => {
    console.error("Failed to play hurt sound", err);
  });
              livesRef.current--;
            }
          }
        }

        if (collidedItemIds.size > 0) {
          newItems = newItems.filter(item => !collidedItemIds.has(item.id));
          if (livesRef.current <= 0) {
            setGameState("gameOver");
            return []; // Clear items on game over
          }
        }

        // Spawn new items
        // Spawn rate accelerates quickly; min 120ms
        const spawnInterval = Math.max(120, 600 - scoreRef.current * 15);
        if (timestamp - lastSpawnTimeRef.current > spawnInterval) {
          lastSpawnTimeRef.current = timestamp;
          const gameAreaWidth = gameAreaRef.current ? gameAreaRef.current.clientWidth : 800;
          const itemsToSpawn = 1 + Math.floor(scoreRef.current / 15);
          for (let i = 0; i < itemsToSpawn; i++) {
            const newItem: FallingItem = {
              id: itemCounterRef.current++,
              x: Math.random() * (gameAreaWidth - 30),
              y: -30,
              type: Math.random() > 0.2 ? "food" : "jalapeno",
              speed: 2 + Math.random() * 3 + Math.floor(scoreRef.current / 10),
            };
            newItems.push(newItem);
          }
        }
        
        return newItems;
      });

      setScore(scoreRef.current);
      setLives(livesRef.current);
      forceRender(prev => prev + 1);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  const handleStartGame = () => {
    // Initialize sounds
    if (!munchSoundRef.current) {
      munchSoundRef.current = new Audio("/sounds/munch.mp3");
      hurtSoundRef.current = new Audio("/sounds/hurt.mp3");
    }

    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    hamsterXRef.current = 370;
    setHamsterX(370);
    setFallingItems([]);
    lastSpawnTimeRef.current = 0;
    itemCounterRef.current = 0;
    setGameState("playing");
  };

  const handleSubmit = () => {
    submitScore.mutate({ playerName, score });
  };

  const handlePlayAgain = () => {
    setGameState("idle");
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setPlayerName("");
    setFallingItems([]);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-[#f9ffd9] rounded-lg shadow-lg w-full max-w-4xl">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Tanoshi Game</h2>
      
      {/* Game stats */}
      {gameState === "playing" && (
        <div className="flex justify-between w-full max-w-2xl mb-2">
          <div className="text-xl font-bold">Score: {score}</div>
          <div className="text-xl font-bold">Lives: {lives > 0 ? "❤️".repeat(lives) : ""}</div>
        </div>
      )}

      {gameState === "idle" && (
        <div className="flex flex-col items-center">
          <div className="mb-6 text-center">
            <p className="text-lg mb-2">Help the hamster catch food and avoid jalapeños!</p>
            <p className="text-md mb-4">Use ← → arrow keys or A/D to move</p>
          </div>
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105"
            onClick={handleStartGame}
          >
            Start Game
          </button>
          
          <div className="mt-8 w-full">
            <Leaderboard />
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <div 
          ref={gameAreaRef}
          className="relative w-full h-[60vh] max-h-[600px] bg-sky-100 border-4 border-amber-800 rounded-lg overflow-hidden"
        >
          {/* Ground */}
          <div className="absolute bottom-0 w-full h-20 bg-green-600"></div>
          
          {/* Hamster */}
          <Hamster x={hamsterX} y={hamsterY} dir={hamsterDir} />
          
          {/* Falling items */}
          {fallingItems.map(item => (
            <Food 
              key={item.id} 
              x={item.x} 
              y={item.y} 
              type={item.type} 
            />
          ))}
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="flex flex-col items-center">
          <p className="text-3xl font-bold mb-2">Game Over!</p>
          <p className="text-2xl mb-6">Final Score: {score}</p>
          
          <div className="mb-6 w-full max-w-md">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 mr-2 text-lg w-full mb-2"
            />
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-lg w-full"
              onClick={handleSubmit}
              disabled={submitScore.isPending || playerName.trim() === ""}
            >
              {submitScore.isPending ? "Submitting..." : "Submit Score"}
            </button>
            {submitScore.isSuccess && <p className="text-green-500 mt-2 text-center">Score submitted successfully!</p>}
          </div>
          
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-full text-lg"
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
          
          <div className="mt-8 w-full">
            <Leaderboard />
          </div>
        </div>
      )}
    </div>
  );
}
