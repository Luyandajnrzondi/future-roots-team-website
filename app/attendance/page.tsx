import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { TeamMember, Attendance } from '@/lib/types';
import { AttendancePageClient } from './attendance-client';

export const dynamic = 'force-dynamic';

async function getAttendanceData() {
  const supabase = await createClient();
  
  const [membersRes, attendanceRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase.from('attendance').select('*').order('date', { ascending: false }),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    attendance: (attendanceRes.data || []) as Attendance[],
  };
}

export default async function AttendancePage() {
  const { members, attendance } = await getAttendanceData();

  return (
    <div className="min-h-screen bg-[#F5F2EF]">
      <Header />
      <AttendancePageClient members={members} initialAttendance={attendance} />
    </div>
  );
}
