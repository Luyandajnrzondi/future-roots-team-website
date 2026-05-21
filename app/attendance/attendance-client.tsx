'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamMember, Attendance } from '@/lib/types';
import { ContributionCalendar } from '@/components/contribution-calendar';
import { AttendanceForm } from '@/components/attendance-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AttendancePageClientProps {
  members: TeamMember[];
  initialAttendance: Attendance[];
}

export function AttendancePageClient({ members, initialAttendance }: AttendancePageClientProps) {
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [year, setYear] = useState(new Date().getFullYear());
  const router = useRouter();

  const filteredAttendance = selectedMember === 'all'
    ? initialAttendance
    : initialAttendance.filter((a) => a.member_id === selectedMember);

  const selectedMemberData = members.find((m) => m.id === selectedMember);

  // Calculate stats
  const yearAttendance = filteredAttendance.filter((a) => a.date.startsWith(year.toString()));
  const presentCount = yearAttendance.filter((a) => a.status === 'present').length;
  const absentCount = yearAttendance.filter((a) => a.status === 'absent').length;
  const lateCount = yearAttendance.filter((a) => a.status === 'late').length;

  const handleRefresh = () => {
    router.refresh();
  };

  const years = [2024, 2025, 2026];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Track class attendance contribution calendar
          </p>
        </div>
        <AttendanceForm teamMembers={members} onSubmit={handleRefresh} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Select member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-[120px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-white/70 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{yearAttendance.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2d5a27]">{presentCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FEBA4F]">{lateCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{absentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="bg-white/70 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>
            {selectedMember === 'all' ? 'Team Attendance' : `${selectedMemberData?.name}'s Attendance`} - {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContributionCalendar
            attendance={filteredAttendance}
            member={selectedMemberData}
            year={year}
          />
        </CardContent>
      </Card>

      {/* Member List with quick stats */}
      {selectedMember === 'all' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Member Attendance Summary</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const memberAttendance = initialAttendance.filter(
                (a) => a.member_id === member.id && a.date.startsWith(year.toString())
              );
              const memberPresent = memberAttendance.filter((a) => a.status === 'present').length;
              const memberTotal = memberAttendance.length;
              const percentage = memberTotal > 0 ? Math.round((memberPresent / memberTotal) * 100) : 0;

              return (
                <Card
                  key={member.id}
                  className="bg-white/70 backdrop-blur-sm border-border/50 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all"
                  onClick={() => setSelectedMember(member.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {memberPresent}/{memberTotal} days present
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">{percentage}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
