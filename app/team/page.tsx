import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { TeamMemberCard } from '@/components/team-member-card';
import { TeamMember, Position } from '@/lib/types';
import { TeamMemberEditor } from './team-member-editor';

export const dynamic = 'force-dynamic';

async function getTeamData() {
  const supabase = await createClient();
  
  const [membersRes, positionsRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase.from('positions').select('*').order('title'),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    positions: (positionsRes.data || []) as Position[],
  };
}

export default async function TeamPage() {
  const { members, positions } = await getTeamData();

  return (
    <div className="min-h-screen bg-[#F5F2EF]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Our Team</h1>
            <p className="text-muted-foreground mt-1">
              Meet the {members.length} members of Future Roots
            </p>
          </div>
          <TeamMemberEditor positions={positions} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No team members found.</p>
          </div>
        )}
      </main>
    </div>
  );
}
