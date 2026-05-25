"use client";
import React, { useState, useEffect, useCallback } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import Image from "next/image";
import H2 from "./ui/H2";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ArrowButton from "./ui/ArrowButton";

interface CarouselItem {
  id: string | number;
  image: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  onButtonClick?: () => void;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
  showArrows?: boolean;
  className?: string;
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  autoPlayInterval = 5000,
  showArrows = true,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === items.length - 1 ? 0 : prevIndex + 1,
    );
  }, [items.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? items.length - 1 : prevIndex - 1,
    );
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, items.length, currentIndex]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-200 rounded-lg">
        <p className="text-gray-500">No items to display</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Main carousel container */}
      <div className="relative h-svh overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {items.map((item, idx) => {
            const isProjectLink =
              item.buttonLink && item.buttonLink.startsWith("/projects/");
            const slug =
              isProjectLink && item.buttonLink
                ? item.buttonLink.replace("/projects/", "")
                : "";
            const transitionName = slug ? `hero-${slug}` : undefined;

            return (
              <div
                key={item.id}
                className="min-w-full h-full relative overflow-hidden">
                {/* Parallax container for background image */}
                <div
                  className="absolute w-full h-[130%] top-[-15%] left-0"
                  style={{
                    transform: `translateY(${scrollY * 0.3}px)`,
                    willChange: "transform",
                  }}>
                  <Image
                    src={item.image}
                    alt={item.title || "Interior Design Carousel Item"}
                    fill
                    priority={idx === 0}
                    quality={90}
                    sizes="100vw"
                    className={`object-cover transition-transform duration-3000 ease-out
              ${
                idx === currentIndex
                  ? "scale-103 delay-500"
                  : "scale-100 delay-0"
              }`}
                    style={
                      {
                        willChange: "transform",
                        ...(transitionName
                          ? { viewTransitionName: transitionName }
                          : {}),
                      } as React.CSSProperties
                    }
                  />
                </div>

                {(item.title || item.description) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-6">
                    {/* Floating parallax text element */}
                    <div
                      className="text-center"
                      style={{
                        transform: `translateY(${scrollY * 0.15}px)`,
                        willChange: "transform",
                      }}>
                      {item.title && (
                        <H2 className="text-white">{item.title}</H2>
                      )}
                      {item.description && (
                        <p className="text-white/90 text-base lg:text-xl mb-4">
                          {item.description}
                        </p>
                      )}
                      {item.buttonText && item.buttonLink && (
                        <div className="flex justify-center mt-6">
                          <TransitionLink href={item.buttonLink}>
                            <ArrowButton>{item.buttonText}</ArrowButton>
                          </TransitionLink>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation arrows */}
        {showArrows && items.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 transition-all duration-200 hover:scale-110 cursor-pointer rounded-full "
              aria-label="Previous slide">
              <ArrowLeft size={40} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 transition-all duration-200 hover:scale-110 cursor-pointer rounded-full"
              aria-label="Next slide">
              <ArrowRight size={40} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Carousel;
