'use client';

import { useState } from 'react';
import { Upload, TeamMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Image as ImageIcon, Video, Music, Link2, ExternalLink, Download, Trash2, Eye, X, Play } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface UploadCardProps {
  upload: Upload;
  teamMembers: TeamMember[];
  onDelete: () => void;
}

function getFileIcon(fileType: string | null, linkUrl: string | null) {
  if (linkUrl) {
    // Check if it's a video link
    if (isVideoLink(linkUrl)) return Video;
    return Link2;
  }
  if (!fileType) return FileText;
  
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType === 'application/pdf') return FileText;
  return FileText;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function isVideoLink(url: string): boolean {
  const videoPatterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//,
    /vimeo\.com\//,
    /player\.vimeo\.com\//,
    /dailymotion\.com\//,
    /twitch\.tv\//,
  ];
  return videoPatterns.some(pattern => pattern.test(url));
}

function getEmbedUrl(url: string): string | null {
  // YouTube - handle watch, short links, and embed URLs
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?/]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // If it's already a valid YouTube embed URL, return it directly
  if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
    // Extract the video ID and rebuild clean embed URL
    const embedMatch = url.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&\s]+)/);
    if (embedMatch) {
      return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
  }
  
  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return null;
}

function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowercaseUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowercaseUrl.includes(ext));
}

function isPdfUrl(url: string | null, fileType: string | null): boolean {
  if (fileType === 'application/pdf') return true;
  if (url && url.toLowerCase().includes('.pdf')) return true;
  return false;
}

export function UploadCard({ upload, teamMembers, onDelete }: UploadCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const Icon = getFileIcon(upload.file_type, upload.link_url);
  const uploader = teamMembers.find((m) => m.id === upload.uploaded_by);
  const supabase = createClient();

  const isImage = upload.file_type?.startsWith('image/') || (upload.link_url && isImageUrl(upload.link_url));
  const isVideo = upload.file_type?.startsWith('video/') || (upload.link_url && isVideoLink(upload.link_url));
  const isPdf = isPdfUrl(upload.file_url, upload.file_type);
  const embedUrl = upload.link_url ? getEmbedUrl(upload.link_url) : null;
  
  const canPreview = isImage || isVideo || isPdf || embedUrl;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this upload?')) return;
    
    try {
      // Delete from storage if it's a file
      if (upload.file_url) {
        const fileName = upload.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('uploads').remove([fileName]);
        }
      }
      
      // Delete from database
      await supabase.from('uploads').delete().eq('id', upload.id);
      onDelete();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const renderPreview = () => {
    // Image preview
    if (isImage) {
      const imageUrl = upload.file_url || upload.link_url;
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/5">
          <img
            src={imageUrl!}
            alt={upload.title}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    }

    // Video embed preview
    if (embedUrl) {
      return (
        <div className="relative w-full aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Direct video file
    if (isVideo && upload.file_url) {
      return (
        <div className="relative w-full aspect-video">
          <video
            src={upload.file_url}
            controls
            className="w-full h-full"
          />
        </div>
      );
    }

    // PDF preview
    if (isPdf && upload.file_url) {
      return (
        <div className="relative w-full h-[70vh]">
          <iframe
            src={`${upload.file_url}#toolbar=1&navpanes=1`}
            className="w-full h-full border-0"
            title={upload.title}
          />
        </div>
      );
    }

    return null;
  };

  // Get thumbnail for card
  const renderThumbnail = () => {
    if (isImage) {
      const imageUrl = upload.file_url || upload.link_url;
      return (
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted mb-3">
          <img
            src={imageUrl!}
            alt={upload.title}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (embedUrl) {
      // Show video thumbnail or placeholder
      const youtubeMatch = upload.link_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
      if (youtubeMatch) {
        return (
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted mb-3 group cursor-pointer" onClick={() => setViewerOpen(true)}>
            <img
              src={`https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`}
              alt={upload.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <Play className="w-12 h-12 text-white" />
            </div>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <>
      <Card className="group bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-base line-clamp-1">{upload.title}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(upload.created_at), 'MMM d, yyyy')}</span>
                  {upload.file_size && (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(upload.file_size)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {upload.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Thumbnail preview for images and videos */}
          {renderThumbnail()}
          
          {upload.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{upload.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            {uploader && (
              <span className="text-xs text-muted-foreground">
                By {uploader.name}
              </span>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              {canPreview && (
                <Button size="sm" variant="outline" onClick={() => setViewerOpen(true)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              )}
              {upload.link_url && !canPreview && (
                <Button size="sm" variant="outline" asChild>
                  <a href={upload.link_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </a>
                </Button>
              )}
              {upload.file_url && (
                <Button size="sm" variant="outline" asChild>
                  <a href={upload.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-full bg-white p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{upload.title}</DialogTitle>
              <div className="flex items-center gap-2">
                {upload.file_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={upload.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </Button>
                )}
                {upload.link_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={upload.link_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Original
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="p-4">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
