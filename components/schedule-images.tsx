'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, CalendarDays, ImageIcon, Loader2 } from 'lucide-react';

interface ScheduleImage {
  id: number;
  settingKey: string;
  url: string | null;
  label: string;
  isUploading: boolean;
}

export function ScheduleImages() {
  const [scheduleImages, setScheduleImages] = useState<ScheduleImage[]>([
    { id: 1, settingKey: 'schedule_image_1', url: null, label: 'Schedule Image 1 (Weeks 1-14)', isUploading: false },
    { id: 2, settingKey: 'schedule_image_2', url: null, label: 'Schedule Image 2 (Weeks 15-26)', isUploading: false },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load existing images from site_settings on mount
  useEffect(() => {
    const loadImages = async () => {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['schedule_image_1', 'schedule_image_2']);

      if (data) {
        setScheduleImages((prev) =>
          prev.map((img) => {
            const setting = data.find((s) => s.key === img.settingKey);
            return setting?.value ? { ...img, url: setting.value } : img;
          })
        );
      }
      setIsLoading(false);
    };

    loadImages();
  }, []);

  const handleFileSelect = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    // Validate file size (max 5MB for schedule images)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const scheduleImage = scheduleImages[index];
    
    // Set uploading state
    setScheduleImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, isUploading: true } : img))
    );

    try {
      const supabase = createClient();

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `schedule-${scheduleImage.id}-${Date.now()}.${fileExt}`;
      const filePath = `schedules/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      let imageUrl: string;

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fallback: convert to base64 data URL
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // Save/update in site_settings
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', scheduleImage.settingKey)
        .single();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ value: imageUrl, updated_at: new Date().toISOString() })
          .eq('key', scheduleImage.settingKey);
      } else {
        await supabase
          .from('site_settings')
          .insert({ key: scheduleImage.settingKey, value: imageUrl });
      }

      // Update local state
      setScheduleImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, url: imageUrl, isUploading: false } : img
        )
      );
    } catch (error) {
      console.error('Error uploading schedule image:', error);
      alert('Failed to upload image. Please try again.');
      setScheduleImages((prev) =>
        prev.map((img, i) => (i === index ? { ...img, isUploading: false } : img))
      );
    }

    // Reset the file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const scheduleImage = scheduleImages[index];
    
    try {
      const supabase = createClient();
      
      // Remove from site_settings
      await supabase
        .from('site_settings')
        .update({ value: null, updated_at: new Date().toISOString() })
        .eq('key', scheduleImage.settingKey);

      // Update local state
      setScheduleImages((prev) =>
        prev.map((img, i) => (i === index ? { ...img, url: null } : img))
      );
    } catch (error) {
      console.error('Error removing schedule image:', error);
    }

    // Reset the file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  if (isLoading) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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

            {scheduleImage.isUploading ? (
              <div className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : scheduleImage.url ? (
              <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                <div className="relative w-full aspect-[16/9]">
                  <Image
                    src={scheduleImage.url}
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
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WebP (max 5MB)</p>
                </div>
              </button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
