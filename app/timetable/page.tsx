import { createClient } from '@/lib/supabase/server';
import { TimetableClient } from './timetable-client';

export default async function TimetablePage() {
  const supabase = await createClient();
  
  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .order('name');

  const { data: entries } = await supabase
    .from('timetable_entries')
    .select('*')
    .order('day_of_week')
    .order('start_time');

  return (
    <TimetableClient 
      members={members || []} 
      initialEntries={entries || []} 
    />
  );
}
