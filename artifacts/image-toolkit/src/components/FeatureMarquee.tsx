import React from "react";
import { motion } from "framer-motion";

const features = [
  "Resize Image",
  "RemoveBg",
  "Asset Generator",
  "Crop",
  "Compress",
  "Watermark",
  "Privacy First",
  "Fast & Secure",
  "High Quality",
];

const marqueeVariants = {
  animate: (direction: number) => ({
    x: direction > 0 ? ["0%", "-50%"] : ["-50%", "0%"],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 30,
        ease: "linear",
      },
    },
  }),
};

const MarqueeRow = ({ items, direction }: { items: string[], direction: number }) => {
  // Double the items to ensure seamless loop with 50% translation
  const displayItems = [...items, ...items];
  
  return (
    <div className="flex overflow-hidden whitespace-nowrap py-2 select-none">
      <motion.div
        className="flex gap-8 items-center"
        variants={marqueeVariants}
        animate="animate"
        custom={direction}
      >
        {displayItems.map((item, index) => (
          <div key={index} className="flex items-center gap-8">
            <span className="text-xl md:text-2xl font-bold text-muted-foreground/30 hover:text-primary transition-colors cursor-default">
              {item}
            </span>
            <span className="text-xl md:text-2xl font-light text-muted-foreground/10">|</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export function FeatureMarquee() {
  return (
    <div className="w-full py-12 flex flex-col gap-4 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
      <MarqueeRow items={features} direction={1} />
      <MarqueeRow items={features} direction={-1} />
    </div>
  );
}
