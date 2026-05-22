'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Plus, GripVertical, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
}

interface HeroSliderUploadProps {
  onSlidesChange?: () => void;
}

export function HeroSliderUpload({ onSlidesChange }: HeroSliderUploadProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSlides = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (data) {
      setSlides(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchSlides();
    }
  }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      // Upload to documents folder inside the uploads bucket
      const filePath = `documents/hero-slides/${fileName}`;

      console.log('[v0] Attempting to upload hero slide to:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      let imageUrl: string;

      if (uploadError) {
        console.error('[v0] Upload error details:', uploadError);
        console.error('[v0] Error message:', uploadError.message);
        
        // Check if it's a bucket not found error
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          alert(`Storage bucket error: ${uploadError.message}. Please ensure the 'uploads' bucket exists in Supabase Storage.`);
          setIsUploading(false);
          return;
        }
        
        // For other errors, show the error and try base64 fallback
        console.log('[v0] Falling back to base64 encoding');
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        console.log('[v0] Upload successful:', uploadData);
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
        console.log('[v0] Public URL:', imageUrl);
      }

      // Add new slide to database
      const newOrder = slides.length > 0 
        ? Math.max(...slides.map(s => s.display_order)) + 1 
        : 0;

      const { data: newSlide, error: insertError } = await supabase
        .from('hero_slides')
        .insert({
          image_url: imageUrl,
          title: null,
          subtitle: null,
          display_order: newOrder,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[v0] Insert error:', insertError);
        alert(`Failed to add slide: ${insertError.message}`);
        return;
      }

      if (newSlide) {
        console.log('[v0] Slide added successfully:', newSlide);
        setSlides([...slides, newSlide]);
        onSlidesChange?.();
      }
    } catch (error) {
      console.error('[v0] Error uploading slide:', error);
      alert(`Failed to upload slide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', slideId);

    if (error) {
      console.error('[v0] Delete error:', error);
      alert(`Failed to delete slide: ${error.message}`);
      return;
    }

    setSlides(slides.filter(s => s.id !== slideId));
    onSlidesChange?.();
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('hero_slides')
      .update({ is_active: !slide.is_active, updated_at: new Date().toISOString() })
      .eq('id', slide.id);

    if (error) {
      console.error('[v0] Update error:', error);
      return;
    }

    setSlides(slides.map(s => 
      s.id === slide.id ? { ...s, is_active: !s.is_active } : s
    ));
    onSlidesChange?.();
  };

  const handleUpdateSlide = async (slide: HeroSlide, updates: Partial<HeroSlide>) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('hero_slides')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', slide.id);

    if (error) {
      console.error('[v0] Update error:', error);
      alert(`Failed to update slide: ${error.message}`);
      return;
    }

    setSlides(slides.map(s => 
      s.id === slide.id ? { ...s, ...updates } : s
    ));
    setEditingSlide(null);
    onSlidesChange?.();
  };

  const handleMoveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(s => s.id === slideId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const supabase = createClient();
    const slide1 = slides[currentIndex];
    const slide2 = slides[newIndex];

    // Swap display_order values
    await Promise.all([
      supabase
        .from('hero_slides')
        .update({ display_order: slide2.display_order, updated_at: new Date().toISOString() })
        .eq('id', slide1.id),
      supabase
        .from('hero_slides')
        .update({ display_order: slide1.display_order, updated_at: new Date().toISOString() })
        .eq('id', slide2.id),
    ]);

    // Update local state
    const newSlides = [...slides];
    [newSlides[currentIndex], newSlides[newIndex]] = [newSlides[newIndex], newSlides[currentIndex]];
    setSlides(newSlides);
    onSlidesChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full justify-start">
          <ImageIcon className="h-4 w-4" />
          Manage Hero Slider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hero Slider Settings</DialogTitle>
          <DialogDescription>
            Manage the images displayed in the hero slider on the landing page. Drag to reorder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload New Slide */}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add New Slide
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              Max file size: 5MB. Recommended: 1920x800px
            </span>
          </div>

          {/* Slides List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading slides...
              </div>
            ) : slides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No slides yet. Add your first slide above.</p>
              </div>
            ) : (
              slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    slide.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveSlide(slide.id, 'up')}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                    <span className="text-xs text-center text-muted-foreground">{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveSlide(slide.id, 'down')}
                      disabled={index === slides.length - 1}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-16 w-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={slide.image_url}
                      alt={slide.title || 'Slide'}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Edit Fields */}
                  {editingSlide?.id === slide.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Title (optional)"
                        value={editingSlide.title || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                      />
                      <Input
                        placeholder="Subtitle (optional)"
                        value={editingSlide.subtitle || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSlide(slide, {
                            title: editingSlide.title,
                            subtitle: editingSlide.subtitle,
                          })}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSlide(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {slide.title || 'No title'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {slide.subtitle || 'No subtitle'}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setEditingSlide(slide)}
                      >
                        Edit text
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={slide.is_active}
                        onCheckedChange={() => handleToggleActive(slide)}
                      />
                      {slide.is_active ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSlide(slide.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
