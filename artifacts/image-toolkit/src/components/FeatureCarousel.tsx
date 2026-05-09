import React from "react";
import { Link } from "wouter";
import Autoplay from "embla-carousel-autoplay";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
      "Reduce file size without losing quality for faster web performance.",
    image: "/Compress.webp",
    link: "/",
  },
  {
    title: "Watermark",
    description:
      "Protect your images by adding custom text or image watermarks.",
    image: "/Watermark.webp",
    link: "/",
  },
];

export function FeatureCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  return (
    <section className="w-full py-4">
      <Carousel
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {features.map((feature, index) => (
            <CarouselItem
              key={index}
              className="pl-2 md:pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3"
            >
              <Link href={feature.link}>
                <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-md h-full flex flex-col items-center py-8">
                  <div className="flex items-center justify-center w-26 h-26 rounded-full overflow-hidden bg-white">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-[88px] h-[88px] object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardHeader className="flex-1 p-4">
                    <CardTitle className="text-base md:text-lg">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs md:text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:flex justify-end gap-2 mt-4">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </Carousel>
    </section>
  );
}
