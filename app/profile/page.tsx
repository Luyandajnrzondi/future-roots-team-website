import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { redirect } from 'next/navigation';
import { ProfileEditor } from './profile-editor';
import { ClaimProfile } from './claim-profile';
import { TeamMember, Position } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getProfileData() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { user: null, member: null, positions: [], allMembers: [] };
  }
  
  // Get user's linked member profile
  const [memberRes, positionsRes, allMembersRes] = await Promise.all([
    supabase.from('team_members').select('*').eq('user_id', user.id).single(),
    supabase.from('positions').select('*').order('title'),
    supabase.from('team_members').select('*').is('user_id', null).order('name'),
  ]);
  
  return {
    user,
    member: memberRes.data as TeamMember | null,
    positions: (positionsRes.data || []) as Position[],
    allMembers: (allMembersRes.data || []) as TeamMember[],
  };
}

export default async function ProfilePage() {
  const { user, member, positions, allMembers } = await getProfileData();
  
  if (!user) {
    redirect('/');
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your team member profile and settings
            </p>
          </div>
          
          {member ? (
            <ProfileEditor member={member} positions={positions} />
          ) : (
            <ClaimProfile 
              userEmail={user.email || ''} 
              userName={user.user_metadata?.full_name || ''} 
              allMembers={allMembers}
              positions={positions}
            />
          )}
        </div>
      </main>
    </div>
  );
}
