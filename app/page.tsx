import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { TeamMember, Attendance, Upload } from '@/lib/types';
import { Users, Calendar, Upload as UploadIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const supabase = await createClient();
  
  const [membersRes, attendanceRes, uploadsRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase.from('attendance').select('*').order('date', { ascending: false }).limit(100),
    supabase.from('uploads').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    attendance: (attendanceRes.data || []) as Attendance[],
    uploads: (uploadsRes.data || []) as Upload[],
  };
}

export default async function HomePage() {
  const { members, attendance, uploads } = await getDashboardData();

  const totalMembers = members.length;
  const totalUploads = uploads.length;
  const presentToday = attendance.filter(
    (a) => a.date === new Date().toISOString().split('T')[0] && a.status === 'present'
  ).length;

  const stats = [
    { name: 'Team Members', value: totalMembers, icon: Users, href: '/team' },
    { name: 'Present Today', value: presentToday, icon: Calendar, href: '/attendance' },
    { name: 'Total Uploads', value: totalUploads, icon: UploadIcon, href: '/uploads' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EF]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-8 md:p-12">
            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Welcome to Future Roots
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                A collaborative platform for our team of 17 to grow, track progress, and build something amazing together.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-12">
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Link key={stat.name} href={stat.href}>
                <Card className="bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.name}
                    </CardTitle>
                    <stat.icon className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Team Preview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Our Team</h2>
            <Link href="/team" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {members.slice(0, 6).map((member) => (
              <Card key={member.id} className="bg-white/70 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-semibold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <p className="font-medium text-sm text-foreground truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.position}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Uploads */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Recent Uploads</h2>
            <Link href="/uploads" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {uploads.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uploads.slice(0, 3).map((upload) => (
                <Card key={upload.id} className="bg-white/70 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <UploadIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{upload.title}</p>
                        <p className="text-xs text-muted-foreground">{upload.category}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/70 backdrop-blur-sm border-border/50">
              <CardContent className="p-8 text-center">
                <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No uploads yet</p>
                <Link href="/uploads" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Add your first upload
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
