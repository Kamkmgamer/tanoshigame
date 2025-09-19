import React from "react";
import Image from "next/image";

// Background flowers that fall slowly from the top of the screen.
// Flowers are purely decorative – pointer-events are disabled and they sit behind gameplay.

const FLOWER_URL =
  "https://x8cti9ppp0.ufs.sh/f/fR4eWtZ8tDgy21lJXYYU4JLVDse8FAik7aWdhlSNMz351pYj";

const LEFT_POSITIONS = ["10%", "50%", "80%"] as const;

export const FlowerBG = () => {
  return (
    <div className="fixed inset-0 overflow-hidden select-none pointer-events-none z-0">
      {LEFT_POSITIONS.map((left, idx) => (
        <Image
          key={idx}
          src={FLOWER_URL}
          alt="Flower"
          width={750}
          height={750}
          className="absolute opacity-60 fall-flower select-none pointer-events-none"
          style={{
            left,
            animationDelay: `${idx * 5}s`,
            animationDuration: `${16 + idx * 4}s`,
          }}
        />
      ))}
    </div>
  );
};
