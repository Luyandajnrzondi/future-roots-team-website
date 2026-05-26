'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, CalendarDays, ImageIcon } from 'lucide-react';

interface ScheduleImage {
  id: number;
  file: File | null;
  preview: string | null;
  label: string;
}

export function ScheduleImages() {
  const [scheduleImages, setScheduleImages] = useState<ScheduleImage[]>([
    { id: 1, file: null, preview: null, label: 'Schedule Image 1 (Weeks 1-14)' },
    { id: 2, file: null, preview: null, label: 'Schedule Image 2 (Weeks 15-26)' },
  ]);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileSelect = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScheduleImages((prev) =>
          prev.map((img, i) =>
            i === index
              ? { ...img, file, preview: e.target?.result as string }
              : img
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (index: number) => {
    setScheduleImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, file: null, preview: null } : img
      )
    );
    // Reset the file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-foreground" />
          YDx Journey Schedule
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload schedule images to display the weekly program overview
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {scheduleImages.map((scheduleImage, index) => (
          <div key={scheduleImage.id} className="space-y-3">
            <p className="text-sm font-medium text-foreground">{scheduleImage.label}</p>
            
            <input
              type="file"
              ref={(el) => { fileInputRefs.current[index] = el; }}
              onChange={(e) => handleFileSelect(index, e)}
              accept="image/*"
              className="hidden"
            />

            {scheduleImage.preview ? (
              <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                <div className="relative w-full aspect-[16/9]">
                  <Image
                    src={scheduleImage.preview}
                    alt={scheduleImage.label}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-background/90 backdrop-blur-sm hover:bg-background"
                    onClick={() => triggerFileInput(index)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Replace
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-500/90 backdrop-blur-sm hover:bg-red-500"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md text-muted-foreground">
                    {scheduleImage.file?.name}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => triggerFileInput(index)}
                className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-foreground/30 transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-foreground/5 group-hover:bg-foreground/10 flex items-center justify-center transition-colors">
                  <ImageIcon className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload schedule image</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WebP</p>
                </div>
              </button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
