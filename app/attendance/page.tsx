import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { TeamMember, Attendance } from '@/lib/types';
import { AttendancePageClient } from './attendance-client';

export const dynamic = 'force-dynamic';

async function getAttendanceData() {
  const supabase = await createClient();
  
  // Get current user and their linked member
  const { data: { user } } = await supabase.auth.getUser();
  let currentMemberId: string | null = null;
  
  if (user) {
    const { data: memberData } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();
    currentMemberId = memberData?.id || null;
  }
  
  const [membersRes, attendanceRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase.from('attendance').select('*').order('date', { ascending: false }),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    attendance: (attendanceRes.data || []) as Attendance[],
    currentMemberId,
  };
}

export default async function AttendancePage() {
  const { members, attendance, currentMemberId } = await getAttendanceData();

  return (
    <div className="min-h-screen bg-[#F5F2EF]">
      <Header />
      <AttendancePageClient 
        members={members} 
        initialAttendance={attendance} 
        currentMemberId={currentMemberId}
      />
    </div>
  );
}
