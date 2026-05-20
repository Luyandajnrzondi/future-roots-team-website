'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
}

interface HeroSliderProps {
  initialSlides?: HeroSlide[];
  autoPlayInterval?: number;
  className?: string;
}

export function HeroSlider({ 
  initialSlides = [], 
  autoPlayInterval = 5000,
  className 
}: HeroSliderProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch slides if not provided
  useEffect(() => {
    if (initialSlides.length === 0) {
      const fetchSlides = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (data && data.length > 0) {
          setSlides(data);
        }
      };
      fetchSlides();
    }
  }, [initialSlides.length]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || slides.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, slides.length]);

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return;
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  const goToPrevious = useCallback(() => {
    if (slides.length <= 1) return;
    goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
  }, [currentIndex, slides.length, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, autoPlayInterval, goToNext]);

  // Don't render if no slides
  if (slides.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn("relative w-full h-full overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentIndex 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-105"
            )}
          >
            {/* Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image_url})` }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/60" />
            </div>

            {/* Content */}
            {(slide.title || slide.subtitle) && (
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div 
                  className={cn(
                    "max-w-4xl px-6 transition-all duration-700 delay-200",
                    index === currentIndex 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-8"
                  )}
                >
                  {slide.title && (
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground mb-4 tracking-tight text-balance drop-shadow-lg">
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className="text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto drop-shadow-md">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/30 backdrop-blur-sm text-foreground hover:bg-background/50 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/30 backdrop-blur-sm text-foreground hover:bg-background/50 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all duration-300 rounded-full",
                index === currentIndex
                  ? "w-8 h-2 bg-foreground"
                  : "w-2 h-2 bg-foreground/40 hover:bg-foreground/60"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {slides.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10">
          <div 
            className="h-full bg-foreground/40 transition-all"
            style={{
              width: `${((currentIndex + 1) / slides.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
