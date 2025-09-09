import React from "react";
import Image from "next/image";

export const Food = ({ x, y, type, className }: { x: number; y: number; type: "food" | "jalapeno", className?: string }) => {
  // Placeholder images - replace with actual UploadThing URLs
  const foodImageUrl = "https://x8cti9ppp0.ufs.sh/f/fR4eWtZ8tDgyGnyTumgnhB7mSzbeZCufltU9FYIRpk6NHvMj";
  const jalapenoImageUrl = "https://x8cti9ppp0.ufs.sh/f/fR4eWtZ8tDgy1ilvvE6jSqRGa8nE9WPuA6FJ7LH35prdgoI0";
  
  const imageUrl = type === "food" ? foodImageUrl : jalapenoImageUrl;
  const width = type === "food" ? 80 : 80;
  const height = type === "food" ? 80 : 100;
  
  const animationClass = type === "food" ? "animate-float" : "animate-spin-slow";

  return (
    <div
      className={`absolute pointer-events-none z-10 ${animationClass} ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Image 
        src={imageUrl} 
        alt={type === "food" ? "Food" : "Jalapeño"} 
        width={width} 
        height={height} 
        unoptimized 
      />
    </div>
  );
};