'use client';

import { Upload, TeamMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Image, Video, Music, Link2, ExternalLink, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface UploadCardProps {
  upload: Upload;
  teamMembers: TeamMember[];
  onDelete: () => void;
}

function getFileIcon(fileType: string | null, linkUrl: string | null) {
  if (linkUrl) return Link2;
  if (!fileType) return FileText;
  
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  return FileText;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function UploadCard({ upload, teamMembers, onDelete }: UploadCardProps) {
  const Icon = getFileIcon(upload.file_type, upload.link_url);
  const uploader = teamMembers.find((m) => m.id === upload.uploaded_by);
  const supabase = createClient();

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

  return (
    <Card className="group bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
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
        {upload.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{upload.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          {uploader && (
            <span className="text-xs text-muted-foreground">
              By {uploader.name}
            </span>
          )}
          
          <div className="flex items-center gap-2">
            {upload.link_url && (
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
  );
}
