'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileImageUploadProps {
  memberId: string;
  currentAvatarUrl: string | null;
  memberName: string;
  onUploadComplete?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileImageUpload({
  memberId,
  currentAvatarUrl,
  memberName,
  onUploadComplete,
  size = 'lg',
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const initials = memberName
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Update team member avatar_url
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ avatar_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl.publicUrl);
      onUploadComplete?.(publicUrl.publicUrl);

      // Clean up the object URL
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    setError(null);

    try {
      // Update team member to remove avatar_url
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      onUploadComplete?.('');
    } catch (err) {
      console.error('Remove error:', err);
      setError('Failed to remove image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className={cn(sizeClasses[size], 'ring-4 ring-background/20')}>
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={memberName} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-background text-foreground text-2xl md:text-3xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
            isUploading && 'opacity-100'
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </div>

        {/* Remove button */}
        {previewUrl && !isUploading && (
          <button
            onClick={handleRemoveImage}
            className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
            aria-label="Remove profile image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            {previewUrl ? 'Change Photo' : 'Upload Photo'}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
