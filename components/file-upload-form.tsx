'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, Link2, Loader2, Plus } from 'lucide-react';
import { TeamMember } from '@/lib/types';

interface FileUploadFormProps {
  teamMembers: TeamMember[];
  onUploadComplete: () => void;
}

export function FileUploadForm({ teamMembers, onUploadComplete }: FileUploadFormProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [category, setCategory] = useState('general');
  const [uploadedBy, setUploadedBy] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const supabase = createClient();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.split('.')[0]);
      }
    }
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let fileUrl = null;
      let fileType = null;
      let fileSize = null;

      if (uploadType === 'file' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);

        fileUrl = publicUrl.publicUrl;
        fileType = file.type;
        fileSize = file.size;
      }

      const { error: insertError } = await supabase.from('uploads').insert({
        title,
        description: description || null,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        link_url: uploadType === 'link' ? linkUrl : null,
        uploaded_by: uploadedBy || null,
        category,
      });

      if (insertError) throw insertError;

      // Reset form
      setTitle('');
      setDescription('');
      setLinkUrl('');
      setFile(null);
      setCategory('general');
      setUploadedBy('');
      setOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Upload File or Add Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={uploadType === 'file' ? 'default' : 'outline'}
              onClick={() => setUploadType('file')}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              File
            </Button>
            <Button
              type="button"
              variant={uploadType === 'link' ? 'default' : 'outline'}
              onClick={() => setUploadType('link')}
              className="flex-1 gap-2"
            >
              <Link2 className="h-4 w-4" />
              Link
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          {uploadType === 'file' ? (
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                required
              />
              <p className="text-xs text-muted-foreground">
                Supported: PDF, Documents, Images, Audio, Video
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="presentations">Presentations</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uploadedBy">Uploaded By</Label>
            <Select value={uploadedBy} onValueChange={setUploadedBy}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
