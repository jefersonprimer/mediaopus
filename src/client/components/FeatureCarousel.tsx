import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const features = [
  {
    title: "Remove Background",
    description:
      "Remove backgrounds from your images instantly using AI, right in your browser.",
    image: "/RemoveBg.webp",
    link: "/removebg",
  },
  {
    title: "Resize",
    description:
      "Quickly change dimensions of your images while maintaining quality.",
    image: "/Resize.webp",
    link: "/resize",
  },
  {
    title: "Crop",
    description:
      "Trim and adjust the focus of your images to the perfect aspect ratio.",
    image: "/Crop.webp",
    link: "/resize",
  },
  {
    title: "Asset Generator",
    description:
      "Generate all necessary assets for your mobile app or web project in one click.",
    image: "/Convert.webp",
    link: "/assets",
  },
  {
    title: "Compress",
    description:
      "Fine-tune compression with advanced controls and handle multiple images with ease.",
    image: "/Compress.webp",
    link: "/compress",
  },
  {
    title: "Watermark",
    description:
      "Protect your images by adding custom text or image watermarks.",
    image: "/Watermark.webp",
    link: "/",
  },
];

const marqueeVariants = {
  animate: {
    x: ["0%", "-50%"],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 10,
        ease: "linear" as const,
      },
    },
  },
};

export function FeatureCarousel() {
  // Double the features for seamless looping
  const displayFeatures = [...features, ...features];

  return (
    <section className="w-full py-4 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      <div className="flex whitespace-nowrap">
        <motion.div
          className="flex gap-4 md:gap-6"
          variants={marqueeVariants}
          animate="animate"
          whileHover={{ animationPlayState: "paused" }}
          style={{ cursor: "pointer" }}
        >
          {displayFeatures.map((feature, index) => (
            <div key={index} className="w-[256px] h-[290px] shrink-0 py-4">
              <Link href={feature.link} className="block h-full">
                <Card className="relative h-full flex flex-col cursor-pointer overflow-hidden rounded-xl border border-gray-950/60 backdrop-blur-md bg-black/20 hover:bg-black/40 transition-all dark:border-gray-50/10 dark:bg-[#0f0f0f]/30 dark:hover:bg-[#0f0f0f]/60 hover:border-primary/50 hover:shadow-md items-center justify-center py-4">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full overflow-hidden bg-white mb-2 shrink-0">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-[64px] h-[64px] object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-4 text-center whitespace-normal">
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
