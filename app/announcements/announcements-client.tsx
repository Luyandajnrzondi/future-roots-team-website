'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Announcement, TeamMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Bell,
  Plus,
  Pin,
  Calendar,
  AlertTriangle,
  Megaphone,
  Trash2,
  Edit,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface AnnouncementsClientProps {
  announcements: (Announcement & { creator?: TeamMember })[];
  members: TeamMember[];
}

const typeConfig = {
  general: {
    icon: Megaphone,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'General',
  },
  meeting: {
    icon: Calendar,
    color: 'bg-primary/10 text-primary border-primary/20',
    label: 'Meeting',
  },
  urgent: {
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Urgent',
  },
  event: {
    icon: Bell,
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Event',
  },
};

export function AnnouncementsClient({ announcements: initialAnnouncements, members }: AnnouncementsClientProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [isOpen, setIsOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as Announcement['type'],
    is_pinned: false,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      is_pinned: false,
    });
    setEditingAnnouncement(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const supabase = createClient();

    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([formData]);

        if (error) throw error;
      }

      setIsOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error saving announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      is_pinned: announcement.is_pinned,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const togglePin = async (announcement: Announcement) => {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_pinned: !announcement.is_pinned })
        .eq('id', announcement.id);

      if (error) throw error;
      
      setAnnouncements(prev => 
        prev.map(a => 
          a.id === announcement.id 
            ? { ...a, is_pinned: !a.is_pinned }
            : a
        )
      );
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : announcements.filter(a => a.type === filter);

  // Sort: pinned first, then by date
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">
            Stay updated with team news, meetings, and important events
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </DialogTitle>
              <DialogDescription>
                {editingAnnouncement 
                  ? 'Update the announcement details below.'
                  : 'Add a new announcement to share with the team.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Announcement['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant={formData.is_pinned ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={() => setFormData({ ...formData, is_pinned: !formData.is_pinned })}
                  >
                    <Pin className="h-4 w-4" />
                    {formData.is_pinned ? 'Pinned' : 'Pin this'}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        {Object.entries(typeConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
            className="gap-2"
          >
            <config.icon className="h-4 w-4" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Announcements List */}
      {sortedAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {sortedAnnouncements.map((announcement) => {
            const config = typeConfig[announcement.type];
            const Icon = config.icon;
            const creator = members.find(m => m.id === announcement.created_by);
            
            return (
              <Card 
                key={announcement.id} 
                className={`bg-white/70 backdrop-blur-sm border-border/50 ${announcement.is_pinned ? 'ring-2 ring-primary/20' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          {announcement.is_pinned && (
                            <Pin className="h-4 w-4 text-primary fill-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={config.color}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                          </span>
                          {creator && (
                            <span className="text-xs text-muted-foreground">
                              by {creator.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePin(announcement)}
                      >
                        <Pin className={`h-4 w-4 ${announcement.is_pinned ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this announcement? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(announcement.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80 whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/70 backdrop-blur-sm border-border/50">
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Announcements</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' 
                ? 'There are no announcements yet. Create one to get started!'
                : `No ${typeConfig[filter as keyof typeof typeConfig]?.label.toLowerCase()} announcements found.`
              }
            </p>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
