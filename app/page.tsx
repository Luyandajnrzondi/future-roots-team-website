import { createClient } from '@/lib/supabase/server';
import { TeamMember, Announcement } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, LayoutDashboard, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LandingNavbar } from '@/components/landing-navbar';

export const dynamic = 'force-dynamic';

async function getLandingData() {
  const supabase = await createClient();
  
  const [membersRes, announcementsRes, settingsRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('site_settings').select('*').eq('key', 'logo_url').single(),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    announcements: (announcementsRes.data || []) as Announcement[],
    logoUrl: settingsRes.data?.value || null,
  };
}

export default async function HomePage() {
  const { members, announcements, logoUrl } = await getLandingData();
  const displayedMembers = members.slice(0, 6);
  const hasMoreMembers = members.length > 6;

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar logoUrl={logoUrl} />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-muted/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-8">
                A Team of {members.length} Dedicated Members
              </p>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-foreground mb-8 tracking-tight text-balance leading-[1.1]">
                Growing Together for a
                <span className="block italic font-serif">Brighter Future</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed text-pretty">
                Future Roots is a passionate team dedicated to creating sustainable solutions 
                and empowering communities through collaboration and innovation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#team">
                  <button className="group inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-full text-sm font-medium transition-all duration-300 hover:gap-4">
                    Meet Our Team
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-3 px-8 py-4 border border-foreground/20 text-foreground rounded-full text-sm font-medium transition-all duration-300 hover:bg-foreground/5">
                    <LayoutDashboard className="h-4 w-4" />
                    Team Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-foreground/20 to-foreground/40" />
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                  About Us
                </p>
                <h2 className="text-4xl md:text-5xl font-light text-foreground mb-8 tracking-tight">
                  Who We Are
                </h2>
              </div>
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Future Roots is a collaborative initiative bringing together {members.length} dedicated individuals 
                  who share a common vision for positive change. Our team combines diverse skills, backgrounds, 
                  and perspectives to tackle challenges and create meaningful impact in our communities.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe that sustainable progress comes from working together, learning from each other, 
                  and staying committed to our shared values.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-32 bg-secondary/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Our Mission
              </p>
              <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                What We Stand For
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Sustainable Growth', description: 'Building eco-friendly solutions that nurture communities and the environment.' },
                { title: 'Community Power', description: 'Creating opportunities for local communities to thrive through education.' },
                { title: 'Innovation', description: 'Developing innovative approaches to address challenges effectively.' },
                { title: 'Inclusivity', description: 'Ensuring our initiatives are accessible and beneficial to all members.' },
              ].map((value, index) => (
                <div 
                  key={index} 
                  className="group p-8 bg-card/60 backdrop-blur-sm rounded-3xl border border-border/50 hover:bg-card transition-all duration-500"
                >
                  <span className="text-sm text-muted-foreground font-medium">0{index + 1}</span>
                  <h3 className="text-xl font-medium text-foreground mt-4 mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="py-32 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
              <div>
                <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                  Our Team
                </p>
                <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                  Meet the People Behind
                  <span className="block italic font-serif">Future Roots</span>
                </h2>
              </div>
              {hasMoreMembers && (
                <Link href="/dashboard">
                  <button className="group inline-flex items-center gap-3 px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium transition-all duration-300 hover:gap-4">
                    <Users className="h-4 w-4" />
                    View All {members.length} Members
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {displayedMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="group text-center"
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
                  <p className="font-medium text-foreground text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{member.position}</p>
                </div>
              ))}
            </div>

            {hasMoreMembers && (
              <div className="text-center mt-12 md:hidden">
                <Link href="/dashboard">
                  <button className="group inline-flex items-center gap-3 px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium transition-all duration-300">
                    <Users className="h-4 w-4" />
                    View All {members.length} Members
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <section className="py-32 bg-secondary/50">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
                <div>
                  <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                    Latest Updates
                  </p>
                  <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                    Stay Informed
                  </h2>
                </div>
                <Link href="/announcements">
                  <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    View All Updates
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                  <article 
                    key={announcement.id} 
                    className="group p-8 bg-card/60 backdrop-blur-sm rounded-3xl border border-border/50 hover:bg-card transition-all duration-500"
                  >
                    <time className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </time>
                    <h3 className="text-lg font-medium text-foreground mt-3 mb-2">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {announcement.content}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-32 border-t border-border">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Part of the Team?
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8 tracking-tight">
              Access Your Dashboard
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              View schedules, track attendance, manage files, and stay updated with the latest announcements.
            </p>
            <Link href="/dashboard">
              <button className="group inline-flex items-center gap-3 px-10 py-5 bg-foreground text-background rounded-full text-base font-medium transition-all duration-300 hover:gap-4">
                <LayoutDashboard className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Future Roots Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                  <span className="text-xs font-medium text-background">FR</span>
                </div>
              )}
              <span className="font-medium text-foreground">Future Roots</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Building a sustainable future, together.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
