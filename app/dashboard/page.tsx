import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { TeamMember, Attendance, Upload, Announcement } from '@/lib/types';
import { Users, Calendar, Upload as UploadIcon, Bell, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ScheduleImages } from '@/components/schedule-images';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const supabase = await createClient();
  
  const [membersRes, attendanceRes, uploadsRes, announcementsRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase.from('attendance').select('*').order('date', { ascending: false }).limit(100),
    supabase.from('uploads').select('*').order('created_at', { ascending: false }).limit(5),
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    attendance: (attendanceRes.data || []) as Attendance[],
    uploads: (uploadsRes.data || []) as Upload[],
    announcements: (announcementsRes.data || []) as Announcement[],
  };
}

const announcementTypeConfig = {
  general: { color: 'bg-blue-100 text-blue-800' },
  meeting: { color: 'bg-primary/10 text-primary' },
  urgent: { color: 'bg-red-100 text-red-800' },
  event: { color: 'bg-amber-100 text-amber-800' },
};

export default async function DashboardPage() {
  const { members, attendance, uploads, announcements } = await getDashboardData();

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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 md:p-12">
            <div className="relative z-10">
              <p className="text-sm tracking-[0.2em] uppercase text-background/60 mb-4">Dashboard</p>
              <h1 className="text-3xl md:text-5xl font-light text-background mb-4 tracking-tight">
                Welcome to Future Roots
              </h1>
              <p className="text-lg md:text-xl text-background/70 max-w-2xl">
                A collaborative platform for our team of {totalMembers} to grow, track progress, and build something amazing together.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-background/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        </section>

        {/* Announcements Banner */}
        {announcements.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-foreground" />
                Latest Announcements
              </h2>
              <Link href="/announcements" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {announcements.slice(0, 3).map((announcement) => (
                <div 
                  key={announcement.id} 
                  className={`p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 transition-all duration-300 hover:bg-card ${announcement.is_pinned ? 'ring-1 ring-foreground/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className={`${announcementTypeConfig[announcement.type].color} rounded-full`}>
                      {announcement.type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat, index) => (
              <Link key={stat.name} href={stat.href}>
                <div className="group p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 hover:bg-card transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground font-medium">0{index + 1}</span>
                    <stat.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.name}</p>
                  <p className="text-3xl font-light text-foreground tracking-tight">{stat.value}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Team Preview */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-foreground">Our Team</h2>
            <Link href="/team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {members.slice(0, 6).map((member) => (
              <div key={member.id} className="group text-center p-4 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 hover:bg-card transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-light text-muted-foreground">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <p className="font-medium text-sm text-foreground truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.position}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Uploads */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-foreground">Recent Uploads</h2>
            <Link href="/uploads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          {uploads.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uploads.slice(0, 3).map((upload) => (
                <div key={upload.id} className="p-5 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 hover:bg-card transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <UploadIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{upload.title}</p>
                      <p className="text-xs text-muted-foreground">{upload.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 text-center">
              <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No uploads yet</p>
              <Link href="/uploads" className="text-sm text-foreground hover:underline mt-2 inline-block">
                Add your first upload
              </Link>
            </div>
          )}
        </section>

        {/* Schedule Images Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-medium text-foreground">Program Schedule</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage the YDx Journey weekly schedule images
            </p>
          </div>
          <ScheduleImages />
        </section>
      </main>
    </div>
  );
}
