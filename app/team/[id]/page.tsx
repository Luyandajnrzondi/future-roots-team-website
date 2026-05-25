import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
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

  const initials = member.name
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

        {/* Member Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 md:p-12 mb-8">
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background/20">
              {member.avatar_url && (
                <AvatarImage src={member.avatar_url} alt={member.name} />
              )}
              <AvatarFallback className="bg-background text-foreground text-2xl md:text-3xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-light text-background mb-2 tracking-tight">
                {member.name}
              </h1>
              <Badge className="bg-background/20 text-background border-0 mb-4">
                {member.position}
              </Badge>
              {member.department && (
                <p className="text-background/70 mb-4">{member.department}</p>
              )}
              {member.bio && (
                <p className="text-background/60 max-w-2xl">{member.bio}</p>
              )}
              
              {/* Contact Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </Button>
                  </a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`}>
                    <Button variant="secondary" className="gap-2 bg-background/20 text-background hover:bg-background/30 border-0">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </a>
                )}
                {(member.phone || member.contact) && (
                  <a href={`tel:${member.phone || member.contact}`}>
                    <Button variant="secondary" className="gap-2 bg-background/20 text-background hover:bg-background/30 border-0">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-background/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

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
                                            {teammate.avatar_url && (
                                              <AvatarImage src={teammate.avatar_url} alt={teammate.name} />
                                            )}
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
