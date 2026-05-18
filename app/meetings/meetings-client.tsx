'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TeamMember, Meeting, MeetingAttendee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, Calendar, Clock, MapPin, Users, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, isPast, isToday, isFuture, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface MeetingsClientProps {
  members: TeamMember[];
  initialMeetings: Meeting[];
  initialAttendees: MeetingAttendee[];
}

const MEETING_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'planning', label: 'Planning' },
  { value: 'review', label: 'Review' },
  { value: 'training', label: 'Training' },
  { value: 'social', label: 'Social' },
  { value: 'emergency', label: 'Emergency' },
];

export function MeetingsClient({ members, initialMeetings, initialAttendees }: MeetingsClientProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>(initialAttendees);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [createdBy, setCreatedBy] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  const router = useRouter();
  const supabase = createClient();

  const filteredMeetings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.meeting_date);
      if (viewMode === 'upcoming') {
        return meetingDate >= today;
      } else if (viewMode === 'past') {
        return meetingDate < today;
      }
      return true;
    });
  }, [meetings, viewMode]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMeetingDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setMeetingType('general');
    setCreatedBy('');
    setSelectedAttendees([]);
    setEditingMeeting(null);
  };

  const openEditDialog = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setTitle(meeting.title);
    setDescription(meeting.description || '');
    setMeetingDate(meeting.meeting_date);
    setStartTime(meeting.start_time.slice(0, 5));
    setEndTime(meeting.end_time?.slice(0, 5) || '');
    setLocation(meeting.location || '');
    setMeetingType(meeting.meeting_type);
    setCreatedBy(meeting.created_by || '');
    
    const meetingAttendees = attendees
      .filter(a => a.meeting_id === meeting.id)
      .map(a => a.member_id);
    setSelectedAttendees(meetingAttendees);
    
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const meetingData = {
        title,
        description: description || null,
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime || null,
        location: location || null,
        meeting_type: meetingType,
        created_by: createdBy || null,
      };

      let meetingId: string;

      if (editingMeeting) {
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', editingMeeting.id);
        if (error) throw error;
        meetingId = editingMeeting.id;

        // Delete existing attendees
        await supabase
          .from('meeting_attendees')
          .delete()
          .eq('meeting_id', meetingId);
      } else {
        const { data, error } = await supabase
          .from('meetings')
          .insert(meetingData)
          .select()
          .single();
        if (error) throw error;
        meetingId = data.id;
      }

      // Insert new attendees
      if (selectedAttendees.length > 0) {
        const attendeeData = selectedAttendees.map(memberId => ({
          meeting_id: meetingId,
          member_id: memberId,
          status: 'pending' as const,
        }));
        
        const { error: attendeeError } = await supabase
          .from('meeting_attendees')
          .insert(attendeeData);
        if (attendeeError) throw attendeeError;
      }

      resetForm();
      setDialogOpen(false);
      
      // Refetch data
      const { data: newMeetings } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: true })
        .order('start_time', { ascending: true });
      if (newMeetings) setMeetings(newMeetings);

      const { data: newAttendees } = await supabase
        .from('meeting_attendees')
        .select('*');
      if (newAttendees) setAttendees(newAttendees);
    } catch (error) {
      console.error('Error saving meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      await supabase.from('meetings').delete().eq('id', id);
      setMeetings(meetings.filter(m => m.id !== id));
      setAttendees(attendees.filter(a => a.meeting_id !== id));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  const getMeetingAttendees = (meetingId: string) => {
    return attendees.filter(a => a.meeting_id === meetingId);
  };

  const getStatusBadge = (date: string) => {
    const meetingDate = parseISO(date);
    if (isToday(meetingDate)) {
      return <Badge className="bg-primary">Today</Badge>;
    } else if (isPast(meetingDate)) {
      return <Badge variant="secondary">Past</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
  };

  const toggleAttendee = (memberId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage team meetings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Meeting title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Meeting description (optional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Conference Room, Zoom Link, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Organized By</Label>
                <Select value={createdBy} onValueChange={setCreatedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organizer" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attendee-${member.id}`}
                        checked={selectedAttendees.includes(member.id)}
                        onCheckedChange={() => toggleAttendee(member.id)}
                      />
                      <label
                        htmlFor={`attendee-${member.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Meetings Grid */}
      {filteredMeetings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeetings.map((meeting) => {
            const meetingAttendees = getMeetingAttendees(meeting.id);
            return (
              <Card key={meeting.id} className="bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg line-clamp-1">{meeting.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(meeting.meeting_date)}
                        <Badge variant="outline">{meeting.meeting_type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(meeting.meeting_date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {meeting.start_time.slice(0, 5)}
                    {meeting.end_time && ` - ${meeting.end_time.slice(0, 5)}`}
                  </div>

                  {meeting.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {meeting.location}
                    </div>
                  )}

                  {meeting.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  {meetingAttendees.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {meetingAttendees.length} attendee{meetingAttendees.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {meeting.created_by && (
                    <div className="text-xs text-muted-foreground">
                      Organized by {getMemberName(meeting.created_by)}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(meeting)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(meeting.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {viewMode === 'upcoming' 
                ? 'No upcoming meetings scheduled.'
                : viewMode === 'past'
                ? 'No past meetings.'
                : 'No meetings yet. Schedule your first meeting!'}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
