import { createClient } from '@/lib/supabase/server';
import { TimetableClient } from './timetable-client';

export const dynamic = 'force-dynamic';

export default async function TimetablePage() {
  const supabase = await createClient();
  
  // Get current user and their linked member
  const { data: { user } } = await supabase.auth.getUser();
  let currentMemberId: string | null = null;
  
  if (user) {
    const { data: memberData } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();
    currentMemberId = memberData?.id || null;
  }
  
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
      currentMemberId={currentMemberId}
    />
  );
}
