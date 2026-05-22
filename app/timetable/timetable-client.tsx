'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamMember, TimetableEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, Clock, MapPin, Pencil, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';

interface TimetableClientProps {
  members: TeamMember[];
  initialEntries: TimetableEntry[];
  currentMemberId: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function TimetableClient({ members, initialEntries, currentMemberId }: TimetableClientProps) {
  const [entries, setEntries] = useState<TimetableEntry[]>(initialEntries);
  // Default to current user's member if logged in, otherwise 'all'
  const [selectedMember, setSelectedMember] = useState<string>(currentMemberId || 'all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [memberId, setMemberId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const filteredEntries = selectedMember === 'all' 
    ? entries 
    : entries.filter(e => e.member_id === selectedMember);

  const resetForm = () => {
    setMemberId('');
    setDayOfWeek('1');
    setStartTime('09:00');
    setEndTime('10:00');
    setActivity('');
    setLocation('');
    setNotes('');
    setEditingEntry(null);
  };

  const openEditDialog = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setMemberId(entry.member_id);
    setDayOfWeek(entry.day_of_week.toString());
    setStartTime(entry.start_time.slice(0, 5));
    setEndTime(entry.end_time.slice(0, 5));
    setActivity(entry.activity);
    setLocation(entry.location || '');
    setNotes(entry.notes || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        member_id: memberId,
        day_of_week: parseInt(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        activity,
        location: location || null,
        notes: notes || null,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('timetable_entries')
          .update(data)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('timetable_entries')
          .insert(data);
        if (error) throw error;
      }

      resetForm();
      setDialogOpen(false);
      router.refresh();
      
      // Refetch entries
      const { data: newEntries } = await supabase
        .from('timetable_entries')
        .select('*')
        .order('day_of_week')
        .order('start_time');
      if (newEntries) setEntries(newEntries);
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await supabase.from('timetable_entries').delete().eq('id', id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  const getEntriesForDay = (day: number) => {
    return filteredEntries.filter(e => e.day_of_week === day);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timetable</h1>
          <p className="text-muted-foreground mt-1">
            View and manage weekly schedules for team members
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Filter by member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white">
              <DialogHeader>
                <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add Timetable Entry'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Team Member</Label>
                  <Select value={memberId} onValueChange={setMemberId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
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
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Activity</Label>
                  <Input
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="e.g., Team Meeting, Training, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Conference Room A"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes (optional)"
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingEntry ? 'Update Entry' : 'Add Entry'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayEntries = getEntriesForDay(day.value);
              return (
                <Card key={day.value} className="bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-center">
                      {day.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayEntries.length > 0 ? (
                      dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs space-y-1"
                        >
                          <div className="font-medium text-foreground truncate">
                            {entry.activity}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </div>
                          {entry.location && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {entry.location}
                            </div>
                          )}
                          <div className="text-primary font-medium">
                            {getMemberName(entry.member_id)}
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => openEditDialog(entry)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-4">
                        No entries
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium text-primary">
                          {DAYS_OF_WEEK[entry.day_of_week].short}
                        </div>
                        <div>
                          <div className="font-medium">{entry.activity}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </span>
                            {entry.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {entry.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {getMemberName(entry.member_id)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No timetable entries yet. Add your first entry!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
}
