'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { cn } from '@/lib/utils';

interface HeroSlide {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoplayDelay?: number;
  className?: string;
}

export function HeroSlider({ slides, autoplayDelay = 5000, className }: HeroSliderProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (slides.length === 0) {
    return (
      <div className={cn('relative w-full h-full bg-muted/30 rounded-3xl overflow-hidden', className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">No slides available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Main Carousel */}
      <div className="overflow-hidden rounded-3xl h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative h-full"
            >
              <Image
                src={slide.image_url}
                alt={slide.title || 'Hero slide'}
                fill
                className="object-cover"
                priority
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              
              {/* Text Content */}
              {(slide.title || slide.subtitle) && (
                <div className="absolute bottom-8 left-8 right-8 z-10">
                  {slide.title && (
                    <h3 className="text-2xl md:text-3xl font-light text-foreground mb-2">
                      {slide.title}
                    </h3>
                  )}
                  {slide.subtitle && (
                    <p className="text-muted-foreground text-sm md:text-base">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === selectedIndex
                  ? 'bg-foreground w-6'
                  : 'bg-foreground/40 hover:bg-foreground/60'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
