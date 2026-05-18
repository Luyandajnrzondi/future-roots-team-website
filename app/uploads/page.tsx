import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { TeamMember, Upload } from '@/lib/types';
import { UploadsPageClient } from './uploads-client';

export const dynamic = 'force-dynamic';

async function getUploadsData() {
  const supabase = await createClient();
  
  const [membersRes, uploadsRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase.from('uploads').select('*').order('created_at', { ascending: false }),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    uploads: (uploadsRes.data || []) as Upload[],
  };
}

export default async function UploadsPage() {
  const { members, uploads } = await getUploadsData();

  return (
    <div className="min-h-screen bg-[#F5F2EF]">
      <Header />
      <UploadsPageClient members={members} initialUploads={uploads} />
    </div>
  );
}
