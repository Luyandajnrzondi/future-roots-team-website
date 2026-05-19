import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { AnnouncementsClient } from './announcements-client';
import { Announcement, TeamMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAnnouncementsData() {
  const supabase = await createClient();
  
  const [announcementsRes, membersRes] = await Promise.all([
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('team_members').select('*').order('name'),
  ]);

  return {
    announcements: (announcementsRes.data || []) as Announcement[],
    members: (membersRes.data || []) as TeamMember[],
  };
}

export default async function AnnouncementsPage() {
  const { announcements, members } = await getAnnouncementsData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AnnouncementsClient announcements={announcements} members={members} />
      </main>
    </div>
  );
}
