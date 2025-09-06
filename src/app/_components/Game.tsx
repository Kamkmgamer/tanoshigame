"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "~/trpc/react";
import { Hamster } from "./Hamster";
import { Food } from "./Food";
import { Leaderboard } from "./Leaderboard";

declare global {
  // Extend window for Safari prefix without using `any`
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type FallingItem = {
  id: number;
  x: number;
  y: number;
  type: "food" | "jalapeno";
  speed: number;
};

export function Game() {
  // Game state
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "gameOver">("idle");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerName, setPlayerName] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
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
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const holdDirRef = useRef<"left" | "right" | "none">("none");

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
    if ((gameState !== "playing" && gameState !== "paused") || !gameAreaRef.current) return;
    const height = gameAreaRef.current.clientHeight;
    containerHeightRef.current = height;
    setHamsterY(height - 120);
  }, [gameState]);
  
  // Refs
  const animationFrameRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const itemCounterRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  
  // WebAudio (synth) instead of external mp3s
  const audioCtxRef = useRef<AudioContext | null>(null);
  const unlockAudio = () => {
    if (audioCtxRef.current) return;
    try {
      // Resolve AudioContext constructor with Safari fallback, avoiding `any`.
      const AudioCtxCtor: typeof AudioContext | undefined =
        typeof window !== "undefined"
          ? window.AudioContext ?? window.webkitAudioContext
          : undefined;
      if (AudioCtxCtor) {
        audioCtxRef.current = new AudioCtxCtor();
      }
    } catch {
      audioCtxRef.current = null;
    }
  };
  const playTone = useCallback((freq: number, durationMs: number, type: OscillatorType = "sine") => {
    if (!soundEnabled) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.001; // start silent to avoid pop
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setTargetAtTime(0.05, now, 0.01);
    osc.start();
    // quick decay
    gain.gain.setTargetAtTime(0.0001, now + durationMs / 1000 - 0.05, 0.02);
    osc.stop(now + durationMs / 1000 + 0.05);
  }, [soundEnabled]);
  
  // tRPC
  const utils = api.useUtils();

  const submitScore = api.score.submit.useMutation({
    onSuccess: () => {
      void utils.score.top.invalidate();
    },
  });

  // Handle keyboard input (continuous)
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "paused") return;
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
      if (e.key === " " && gameState === "playing") setGameState("paused");
      else if (e.key === " " && gameState === "paused") setGameState("playing");
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
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
      // Delta time for consistent movement
      const dtMs = lastFrameTimeRef.current == null ? 16 : Math.min(48, timestamp - lastFrameTimeRef.current);
      const dt = dtMs / 1000; // seconds
      lastFrameTimeRef.current = timestamp;

      // Move hamster based on keys/hold direction
      const areaWidth = gameAreaRef.current ? gameAreaRef.current.clientWidth : 800;
      const SPEED = Math.max(250, Math.min(700, 350 + scoreRef.current * 10)); // px/sec scales with score
      const left = keysRef.current.left || holdDirRef.current === "left";
      const right = keysRef.current.right || holdDirRef.current === "right";
      if (left && !right) {
        hamsterXRef.current = Math.max(0, hamsterXRef.current - SPEED * dt);
        setHamsterDir("left");
      } else if (right && !left) {
        hamsterXRef.current = Math.min(areaWidth - 100, hamsterXRef.current + SPEED * dt);
        setHamsterDir("right");
      } else {
        setHamsterDir("none");
      }
      setHamsterX(hamsterXRef.current);

      setFallingItems((prevItems: FallingItem[]) => {
        let newItems = prevItems
          .map((item: FallingItem) => ({
            ...item,
            y: item.y + item.speed * dt,
          }))
          .filter((item) => item.y < (containerHeightRef.current || 600));

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
              playTone(660, 90, "square");
              scoreRef.current++;
            } else {
              // quick double beep
              playTone(180, 60, "sawtooth");
              setTimeout(() => playTone(140, 80, "sawtooth"), 80);
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
        // Spawn rate accelerates; min 110ms
        const spawnInterval = Math.max(110, 620 - scoreRef.current * 14);
        if (timestamp - lastSpawnTimeRef.current > spawnInterval) {
          lastSpawnTimeRef.current = timestamp;
          const gameAreaWidth = gameAreaRef.current ? gameAreaRef.current.clientWidth : 800;
          const itemsToSpawn = 1 + Math.floor(scoreRef.current / 18);
          for (let i = 0; i < itemsToSpawn; i++) {
            const newItem: FallingItem = {
              id: itemCounterRef.current++,
              x: Math.random() * (gameAreaWidth - 30),
              y: -30,
              type: Math.random() > 0.2 ? "food" : "jalapeno",
              // speed in px/sec; scaled by score
              speed: 140 + Math.random() * 120 + Math.floor(scoreRef.current / 12) * 20,
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

    // Kick off the first frame of the game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, hamsterY, playTone]);

  const handleStartGame = () => {
    // Initialize audio
    unlockAudio();
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    if (gameAreaRef.current) {
      hamsterXRef.current = Math.max(0, (gameAreaRef.current.clientWidth - 100) / 2);
    } else {
      hamsterXRef.current = 370;
    }
    setHamsterX(hamsterXRef.current);
    setFallingItems([]);
    lastSpawnTimeRef.current = 0;
    itemCounterRef.current = 0;
    lastFrameTimeRef.current = null;
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
    <div className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-md rounded-3xl shadow-2xl ring-1 ring-black/10 w-full max-w-4xl">
      <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-amber-700 drop-shadow-lg tracking-wide">Tanoshi Game</h2>
      
      {/* Game stats */}
      {(gameState === "playing" || gameState === "paused") && (
        <div className="flex items-center justify-between w-full max-w-2xl mb-4 gap-3 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full shadow">
          <div className="text-2xl font-extrabold text-emerald-800">🍪 {score}</div>
          <div className="text-2xl font-extrabold text-red-600">{lives > 0 ? "❤️".repeat(lives) : "💔"}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow hover:from-amber-600 hover:to-amber-700 transition"
              onClick={() => setGameState(gameState === "playing" ? "paused" : "playing")}
            >
              {gameState === "playing" ? "Pause" : "Resume"}
            </button>
            <button
              aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
              className="px-4 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow hover:from-emerald-600 hover:to-emerald-700 transition"
              onClick={() => setSoundEnabled((s) => !s)}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      )}

      {gameState === "idle" && (
        <div className="flex flex-col items-center">
          <div className="mb-6 text-center">
            <p className="text-lg mb-2">Help the hamster catch food and avoid jalapeños!</p>
            <p className="text-md mb-4">Use ← → arrow keys or A/D to move, or drag/tap on mobile</p>
          </div>
          <button
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-10 rounded-full text-2xl shadow-lg transform transition hover:scale-110"
            onClick={handleStartGame}
          >
            Start Game
          </button>
          
          <div className="mt-8 w-full">
            <Leaderboard />
          </div>
        </div>
      )}

          

      {(gameState === "playing" || gameState === "paused") && (
          <div
            ref={gameAreaRef}
            className="game-area relative w-full max-w-4xl aspect-video bg-gradient-to-b from-sky-300 to-sky-400 rounded-xl shadow-inner overflow-hidden"
          >
                        <Hamster x={hamsterX} y={hamsterY} dir={hamsterDir} />
            {fallingItems.map((item) => (
              <Food
                key={item.id}
                x={item.x}
                y={item.y}
                type={item.type}
              />
            ))}

            {/* Mobile on-screen controls */}
            {gameState === "playing" && (
              <div className="absolute bottom-0 left-0 w-full h-20 flex md:hidden select-none">
                <button
                  className="flex-1 bg-white/40 active:bg-white/60 backdrop-blur-sm text-4xl font-extrabold text-slate-800 shadow-inner transition"
                  onPointerDown={() => (holdDirRef.current = "left")}
                  onPointerUp={() => (holdDirRef.current = "none")}
                  onPointerCancel={() => (holdDirRef.current = "none")}
                  onPointerLeave={() => (holdDirRef.current = "none")}
                >
                  ◀
                </button>
                <button
                  className="flex-1 bg-white/40 active:bg-white/60 backdrop-blur-sm text-4xl font-extrabold text-slate-800 shadow-inner transition"
                  onPointerDown={() => (holdDirRef.current = "right")}
                  onPointerUp={() => (holdDirRef.current = "none")}
                  onPointerCancel={() => (holdDirRef.current = "none")}
                  onPointerLeave={() => (holdDirRef.current = "none")}
                >
                  ▶
                </button>
              </div>
            )}
            {gameState === "paused" && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl px-8 py-6 shadow-2xl text-2xl font-extrabold">Paused</div>
              </div>
            )}
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
