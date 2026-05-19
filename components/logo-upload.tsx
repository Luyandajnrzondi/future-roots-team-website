'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LogoUploadProps {
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

export function LogoUpload({ currentLogoUrl, onLogoChange }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fallback: convert to base64 data URL
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          setPreview(dataUrl);
          
          // Save to site_settings
          await supabase
            .from('site_settings')
            .update({ value: dataUrl, updated_at: new Date().toISOString() })
            .eq('key', 'logo_url');
          
          onLogoChange(dataUrl);
          setOpen(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      
      // Save URL to site_settings
      await supabase
        .from('site_settings')
        .update({ value: publicUrl, updated_at: new Date().toISOString() })
        .eq('key', 'logo_url');
      
      onLogoChange(publicUrl);
      setOpen(false);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    const supabase = createClient();
    
    await supabase
      .from('site_settings')
      .update({ value: null, updated_at: new Date().toISOString() })
      .eq('key', 'logo_url');
    
    setPreview(null);
    onLogoChange(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ImageIcon className="h-4 w-4" />
          Change Logo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Logo</DialogTitle>
          <DialogDescription>
            Upload your team logo. Recommended size: 200x200px. Max file size: 2MB.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Logo preview"
                  className="h-24 w-24 rounded-xl object-contain border border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Upload Input */}
          <div className="space-y-2">
            <Label htmlFor="logo-file">Select Image</Label>
            <Input
              id="logo-file"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={isUploading}
              className="cursor-pointer"
            />
          </div>

          {/* Upload Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
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
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
