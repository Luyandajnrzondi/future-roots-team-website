import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { MemberProfileHeader } from '@/components/member-profile-header';
import { TeamMember, TimetableEntry, Meeting, MeetingAttendee, Contribution, Expense } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Clock, 
  Wallet, 
  Phone, 
  Mail, 
  ArrowLeft,
  MapPin,
  TrendingUp,
  TrendingDown,
  CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format, parseISO, isPast, isToday } from 'date-fns';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

function formatWhatsAppNumber(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // If starts with 0, replace with country code (assuming South Africa +27)
  if (digits.startsWith('0')) {
    return '27' + digits.slice(1);
  }
  return digits;
}

async function getMemberData(id: string) {
  const supabase = await createClient();
  
  const [
    memberRes, 
    allMembersRes, 
    timetableRes, 
    meetingsRes, 
    attendeesRes,
    contributionsRes,
    expensesRes
  ] = await Promise.all([
    supabase.from('team_members').select('*').eq('id', id).single(),
    supabase.from('team_members').select('*').order('name'),
    supabase.from('timetable_entries').select('*').eq('member_id', id).order('day_of_week').order('start_time'),
    supabase.from('meetings').select('*').order('meeting_date', { ascending: true }),
    supabase.from('meeting_attendees').select('*'),
    supabase.from('contributions').select('*').eq('member_id', id).order('contribution_date', { ascending: false }),
    supabase.from('expenses').select('*').eq('paid_by', id).order('expense_date', { ascending: false }),
  ]);

  if (memberRes.error || !memberRes.data) {
    return null;
  }

  const member = memberRes.data as TeamMember;
  const allMembers = (allMembersRes.data || []) as TeamMember[];
  const timetable = (timetableRes.data || []) as TimetableEntry[];
  const meetings = (meetingsRes.data || []) as Meeting[];
  const attendees = (attendeesRes.data || []) as MeetingAttendee[];
  const contributions = (contributionsRes.data || []) as Contribution[];
  const expenses = (expensesRes.data || []) as Expense[];

  // Get teammates (same department)
  const teammates = member.department 
    ? allMembers.filter(m => m.department === member.department && m.id !== member.id)
    : [];

  // Get member's meetings
  const memberMeetingIds = attendees
    .filter(a => a.member_id === id)
    .map(a => a.meeting_id);
  const memberMeetings = meetings.filter(m => memberMeetingIds.includes(m.id));

  // Calculate finance stats
  const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    member,
    teammates,
    timetable,
    meetings: memberMeetings,
    contributions,
    expenses,
    totalContributions,
    totalExpenses,
  };
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getMemberData(id);

  if (!data) {
    notFound();
  }

  const { 
    member, 
    teammates, 
    timetable, 
    meetings, 
    contributions, 
    expenses,
    totalContributions,
    totalExpenses 
  } = data;

  const whatsappNumber = formatWhatsAppNumber(member.contact || member.phone);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/team" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Link>

        {/* Member Profile Header with Image Upload */}
        <MemberProfileHeader member={member} whatsappNumber={whatsappNumber} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Timetable Section */}
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl font-medium">Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {timetable.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const dayEntries = timetable.filter(e => e.day_of_week === index);
                      if (dayEntries.length === 0) return null;
                      return (
                        <div key={day} className="p-4 bg-secondary/50 rounded-2xl">
                          <h4 className="font-medium text-foreground mb-3">{day}</h4>
                          <div className="space-y-2">
                            {dayEntries.map((entry) => (
                              <div key={entry.id} className="text-sm">
                                <p className="font-medium text-foreground">{entry.activity}</p>
                                <p className="text-muted-foreground">
                                  {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                </p>
                                {entry.location && (
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {entry.location}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No schedule entries yet</p>
                )}
              </CardContent>
            </Card>

            {/* Meetings Section */}
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl font-medium">Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                {meetings.length > 0 ? (
                  <div className="space-y-3">
                    {meetings.slice(0, 5).map((meeting) => {
                      const meetingDate = parseISO(meeting.meeting_date);
                      const isUpcoming = !isPast(meetingDate) || isToday(meetingDate);
                      return (
                        <div 
                          key={meeting.id} 
                          className={`p-4 rounded-2xl ${isUpcoming ? 'bg-secondary/50' : 'bg-muted/30'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-medium text-foreground">{meeting.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(meetingDate, 'EEEE, MMMM d, yyyy')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {meeting.start_time.slice(0, 5)}
                                {meeting.end_time && ` - ${meeting.end_time.slice(0, 5)}`}
                              </p>
                              {meeting.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {meeting.location}
                                </p>
                              )}
                            </div>
                            <Badge variant={isUpcoming ? 'default' : 'secondary'}>
                              {isToday(meetingDate) ? 'Today' : isUpcoming ? 'Upcoming' : 'Past'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No meetings scheduled</p>
                )}
              </CardContent>
            </Card>

            {/* Finance Section */}
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl font-medium">Financial Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-500/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Contributions</span>
                    </div>
                    <p className="text-2xl font-medium text-green-600">{formatCurrency(totalContributions)}</p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-muted-foreground">Expenses Paid</span>
                    </div>
                    <p className="text-2xl font-medium text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>

                {/* Recent Transactions */}
                {(contributions.length > 0 || expenses.length > 0) ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
                    {contributions.slice(0, 3).map((contribution) => (
                      <div key={contribution.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                        <div>
                          <p className="font-medium text-foreground text-sm">Contribution</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className="text-green-600 font-medium">+{formatCurrency(Number(contribution.amount))}</span>
                      </div>
                    ))}
                    {expenses.slice(0, 3).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                        <div>
                          <p className="font-medium text-foreground text-sm">{expense.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(expense.expense_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className="text-red-600 font-medium">-{formatCurrency(Number(expense.amount))}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No financial activity yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Teammates Section */}
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl font-medium">
                  {member.department ? `${member.department} Team` : 'Teammates'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teammates.length > 0 ? (
                  <div className="space-y-3">
                    {teammates.map((teammate) => {
                      const teammateInitials = teammate.name
                        .replace(/\([^)]*\)/g, '')
                        .trim()
                        .split(' ')
                        .filter((n) => n.length > 0)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      
                      return (
                        <Link 
                          key={teammate.id} 
                          href={`/team/${teammate.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            {teammate.avatar_url ? (
                              <AvatarImage src={teammate.avatar_url} alt={teammate.name} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                              {teammateInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground text-sm truncate">{teammate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{teammate.position}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {member.department 
                      ? 'No other members in this department' 
                      : 'No department assigned'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Schedule Entries</span>
                  <span className="font-medium">{timetable.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Meetings</span>
                  <span className="font-medium">{meetings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contributions</span>
                  <span className="font-medium">{contributions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expenses Paid</span>
                  <span className="font-medium">{expenses.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
