import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { TeamMember, Position } from '@/lib/types';
import { TeamMemberEditor } from './team-member-editor';
import Image from 'next/image';
import Link from 'next/link';

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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          {/* Header matching homepage #team section */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
            <div>
              <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Our Team
              </p>
              <h1 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                Meet the People Behind
                <span className="block italic font-serif">Future Roots</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-6 max-w-2xl">
                Our dedicated team of {members.length} members working together to create meaningful impact.
              </p>
            </div>
            <TeamMemberEditor positions={positions} />
          </div>

          {/* Grid matching homepage #team section */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {members.map((member) => (
              <Link 
                href={`/team/${member.id}`}
                key={member.id} 
                className="group text-center cursor-pointer"
              >
                <div className="relative mb-4 overflow-hidden rounded-2xl bg-muted/50 aspect-square">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-light text-muted-foreground">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="font-medium text-foreground text-sm group-hover:text-foreground/80 transition-colors">{member.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{member.position}</p>
                {member.department && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{member.department}</p>
                )}
              </Link>
            ))}
          </div>

          {members.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No team members found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
