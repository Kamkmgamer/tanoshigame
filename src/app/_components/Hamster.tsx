import React from "react";
import Image from "next/image";

type HamsterProps = {
  x: number;
  y: number;
  dir?: "left" | "right" | "none";
  className?: string;
};

export const Hamster = ({ x, y, dir = "none", className }: HamsterProps) => {
  // Placeholder image - replace with actual UploadThing URL
  const hamsterImageUrl = "https://x8cti9ppp0.ufs.sh/f/fR4eWtZ8tDgy1iqQXu9jSqRGa8nE9WPuA6FJ7LH35prdgoI0";
  
  return (
    <div
      className={`absolute transition-transform z-10 ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: "100px",
        height: "100px",
      }}
    >
      <Image 
        src={hamsterImageUrl} 
        alt="Hamster" 
        width={100} 
        height={100} 
        style={{ transform: dir === "left" ? "scaleX(-1)" : undefined }}
        unoptimized 
      />
    </div>
  );
};