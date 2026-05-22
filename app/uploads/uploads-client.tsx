'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamMember, Upload } from '@/lib/types';
import { FileUploadForm } from '@/components/file-upload-form';
import { UploadCard } from '@/components/upload-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface UploadsPageClientProps {
  members: TeamMember[];
  initialUploads: Upload[];
  currentMember: { id: string; name: string } | null;
}

export function UploadsPageClient({ members, initialUploads, currentMember }: UploadsPageClientProps) {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredUploads = initialUploads.filter((upload) => {
    const matchesCategory = category === 'all' || upload.category === category;
    const matchesSearch = search === '' || 
      upload.title.toLowerCase().includes(search.toLowerCase()) ||
      upload.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRefresh = () => {
    router.refresh();
  };

  const categories = ['all', 'general', 'documents', 'images', 'videos', 'presentations', 'resources'];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Uploads</h1>
          <p className="text-muted-foreground mt-1">
            Share files, documents, and links with your team
          </p>
        </div>
        <FileUploadForm teamMembers={members} onUploadComplete={handleRefresh} currentMember={currentMember} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search uploads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Uploads Grid */}
      {filteredUploads.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUploads.map((upload) => (
            <UploadCard
              key={upload.id}
              upload={upload}
              teamMembers={members}
              onDelete={handleRefresh}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search || category !== 'all'
              ? 'No uploads match your filters.'
              : 'No uploads yet. Add your first file or link!'}
          </p>
        </div>
      )}
    </main>
  );
}
