import { createClient } from '@/lib/supabase/server';
import { TeamMember, Announcement } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Target, 
  Leaf, 
  Heart, 
  ArrowRight, 
  Bell,
  Calendar,
  Megaphone,
  AlertTriangle,
  LayoutDashboard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

const typeConfig = {
  general: { icon: Megaphone, color: 'bg-blue-100 text-blue-800' },
  meeting: { icon: Calendar, color: 'bg-primary/10 text-primary' },
  urgent: { icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
  event: { icon: Bell, color: 'bg-amber-100 text-amber-800' },
};

const goals = [
  {
    icon: Leaf,
    title: 'Sustainable Growth',
    description: 'Building eco-friendly solutions that nurture communities and the environment for generations to come.',
  },
  {
    icon: Users,
    title: 'Community Empowerment',
    description: 'Creating opportunities for local communities to thrive through education, resources, and collaboration.',
  },
  {
    icon: Target,
    title: 'Innovation & Impact',
    description: 'Developing innovative approaches to address challenges while maximizing positive social impact.',
  },
  {
    icon: Heart,
    title: 'Inclusive Development',
    description: 'Ensuring our initiatives are accessible and beneficial to all members of the community.',
  },
];

export default async function HomePage() {
  const { members, announcements, logoUrl } = await getLandingData();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Future Roots Logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="text-lg font-bold text-primary-foreground">FR</span>
              </div>
            )}
            <span className="text-xl font-semibold text-foreground hidden sm:block">Future Roots</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link 
              href="#about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              About
            </Link>
            <Link 
              href="#goals" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Our Goals
            </Link>
            <Link 
              href="#team" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Team
            </Link>
            <Link href="/dashboard">
              <Button className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Team Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6">
                A Team of {members.length} Dedicated Members
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
                Growing Together for a
                <span className="text-primary"> Brighter Future</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed text-pretty">
                Future Roots is a passionate team dedicated to creating sustainable solutions 
                and empowering communities. We believe in the power of collaboration, innovation, 
                and shared purpose to build a better tomorrow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#goals">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/announcements">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                    <Bell className="h-4 w-4" />
                    View Announcements
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements Preview */}
        {announcements.length > 0 && (
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Latest Updates</h2>
                  <p className="text-muted-foreground mt-1">Stay informed with our latest announcements</p>
                </div>
                <Link href="/announcements">
                  <Button variant="outline" className="gap-2">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {announcements.map((announcement) => {
                  const config = typeConfig[announcement.type];
                  const Icon = config.icon;
                  
                  return (
                    <Card key={announcement.id} className="bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground truncate">{announcement.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {announcement.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section id="about" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">About Us</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Who We Are
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Future Roots is a collaborative initiative bringing together {members.length} dedicated individuals 
                who share a common vision for positive change. Our team combines diverse skills, backgrounds, 
                and perspectives to tackle challenges and create meaningful impact in our communities.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                We believe that sustainable progress comes from working together, learning from each other, 
                and staying committed to our shared values. Every member of our team plays a vital role in 
                achieving our collective goals.
              </p>
            </div>
          </div>
        </section>

        {/* Goals Section */}
        <section id="goals" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Our Mission</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What We Stand For
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our work is guided by these core principles that shape everything we do.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {goals.map((goal, index) => (
                <Card key={index} className="bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <goal.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{goal.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {goal.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Our Team</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Meet the People Behind Future Roots
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our diverse team of {members.length} members brings together unique talents and perspectives.
              </p>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {members.slice(0, 12).map((member) => (
                <Card key={member.id} className="bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full mx-auto mb-3 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <span className="text-lg font-semibold text-primary">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <p className="font-medium text-sm text-foreground truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.position}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {members.length > 12 && (
              <div className="text-center mt-8">
                <Link href="/team">
                  <Button variant="outline" className="gap-2">
                    View All {members.length} Members
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Part of the Team?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Access the team dashboard to view schedules, track attendance, manage files, and stay updated with the latest announcements.
            </p>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">FR</span>
                </div>
              )}
              <span className="font-semibold text-foreground">Future Roots</span>
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
