import { createClient } from '@/lib/supabase/server';
import { MeetingsClient } from './meetings-client';

export default async function MeetingsPage() {
  const supabase = await createClient();
  
  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .order('name');

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: true })
    .order('start_time', { ascending: true });

  const { data: attendees } = await supabase
    .from('meeting_attendees')
    .select('*');

  return (
    <MeetingsClient 
      members={members || []} 
      initialMeetings={meetings || []}
      initialAttendees={attendees || []}
    />
  );
}
