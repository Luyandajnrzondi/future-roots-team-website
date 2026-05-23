'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { TeamMember, Meeting, MeetingAttendee } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Download, Users, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MeetingMinutesProps {
  meeting: Meeting;
  members: TeamMember[];
  attendees: MeetingAttendee[];
}

interface AttendanceRecord {
  memberId: string;
  present: boolean;
}

export function MeetingMinutes({ meeting, members, attendees }: MeetingMinutesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [minutesContent, setMinutesContent] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [decisions, setDecisions] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [secretaryName, setSecretaryName] = useState('');
  
  // Initialize attendance from meeting attendees
  const meetingAttendeeIds = attendees
    .filter(a => a.meeting_id === meeting.id)
    .map(a => a.member_id);
  
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(
    meetingAttendeeIds.map(id => ({ memberId: id, present: false }))
  );

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  const getMemberPosition = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.position || '';
  };

  const toggleAttendance = (memberId: string) => {
    setAttendanceList(prev =>
      prev.map(record =>
        record.memberId === memberId
          ? { ...record, present: !record.present }
          : record
      )
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, y: number, fontSize: number = 11) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      return y + lines.length * (fontSize * 0.4);
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MEETING MINUTES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Meeting Title
    doc.setFontSize(16);
    doc.text(meeting.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Divider line
    doc.setDrawColor(28, 25, 23);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Meeting Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Details', margin, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${format(parseISO(meeting.meeting_date), 'EEEE, MMMM d, yyyy')}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Time: ${meeting.start_time.slice(0, 5)}${meeting.end_time ? ` - ${meeting.end_time.slice(0, 5)}` : ''}`, margin, yPosition);
    yPosition += 6;
    if (meeting.location) {
      doc.text(`Location: ${meeting.location}`, margin, yPosition);
      yPosition += 6;
    }
    doc.text(`Meeting Type: ${meeting.meeting_type.charAt(0).toUpperCase() + meeting.meeting_type.slice(1)}`, margin, yPosition);
    yPosition += 6;
    if (secretaryName) {
      doc.text(`Minutes Recorded By: ${secretaryName}`, margin, yPosition);
      yPosition += 6;
    }
    yPosition += 8;

    // Attendance Section
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance', margin, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    const presentMembers = attendanceList.filter(a => a.present);
    const absentMembers = attendanceList.filter(a => !a.present);

    if (presentMembers.length > 0) {
      doc.text('Present:', margin, yPosition);
      yPosition += 6;
      presentMembers.forEach(record => {
        const name = getMemberName(record.memberId);
        const position = getMemberPosition(record.memberId);
        const displayText = position ? `  - ${name} (${position})` : `  - ${name}`;
        doc.text(displayText, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 3;
    }

    if (absentMembers.length > 0) {
      doc.text('Absent:', margin, yPosition);
      yPosition += 6;
      absentMembers.forEach(record => {
        const name = getMemberName(record.memberId);
        const position = getMemberPosition(record.memberId);
        const displayText = position ? `  - ${name} (${position})` : `  - ${name}`;
        doc.text(displayText, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 3;
    }
    yPosition += 5;

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Meeting Minutes Content
    if (minutesContent) {
      doc.setFont('helvetica', 'bold');
      doc.text('Meeting Minutes', margin, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(minutesContent, yPosition);
      yPosition += 8;
    }

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Decisions Made
    if (decisions) {
      doc.setFont('helvetica', 'bold');
      doc.text('Decisions Made', margin, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(decisions, yPosition);
      yPosition += 8;
    }

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Action Items
    if (actionItems) {
      doc.setFont('helvetica', 'bold');
      doc.text('Action Items', margin, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(actionItems, yPosition);
      yPosition += 8;
    }

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Next Steps
    if (nextSteps) {
      doc.setFont('helvetica', 'bold');
      doc.text('Next Steps', margin, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(nextSteps, yPosition);
      yPosition += 8;
    }

    // Footer with date generated
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated on ${format(new Date(), 'MMMM d, yyyy')} at ${format(new Date(), 'h:mm a')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }

    // Download the PDF
    const fileName = `meeting-minutes-${meeting.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${meeting.meeting_date}.pdf`;
    doc.save(fileName);
  };

  const presentCount = attendanceList.filter(a => a.present).length;
  const totalCount = attendanceList.length;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <FileText className="h-4 w-4" />
          Minutes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meeting Minutes - {meeting.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Meeting Info Summary */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>{' '}
                  {format(parseISO(meeting.meeting_date), 'MMMM d, yyyy')}
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{' '}
                  {meeting.start_time.slice(0, 5)}
                  {meeting.end_time && ` - ${meeting.end_time.slice(0, 5)}`}
                </div>
                {meeting.location && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Location:</span>{' '}
                    {meeting.location}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Secretary Name */}
          <div className="space-y-2">
            <Label>Minutes Recorded By (Secretary)</Label>
            <Input
              value={secretaryName}
              onChange={(e) => setSecretaryName(e.target.value)}
              placeholder="Enter secretary name"
            />
          </div>

          {/* Attendance Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendance Checklist
              </Label>
              <span className="text-sm text-muted-foreground">
                {presentCount} / {totalCount} present
              </span>
            </div>
            
            {attendanceList.length > 0 ? (
              <div className="grid gap-2 p-3 border rounded-lg bg-background max-h-48 overflow-y-auto">
                {attendanceList.map((record) => {
                  const member = members.find(m => m.id === record.memberId);
                  return (
                    <div
                      key={record.memberId}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`attendance-${record.memberId}`}
                          checked={record.present}
                          onCheckedChange={() => toggleAttendance(record.memberId)}
                        />
                        <label
                          htmlFor={`attendance-${record.memberId}`}
                          className="cursor-pointer"
                        >
                          <span className="font-medium">{member?.name || 'Unknown'}</span>
                          {member?.position && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({member.position})
                            </span>
                          )}
                        </label>
                      </div>
                      {record.present && (
                        <CheckCircle2 className="h-4 w-4 text-olive" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3 border rounded-lg">
                No attendees assigned to this meeting.
              </p>
            )}
          </div>

          {/* Meeting Minutes Content */}
          <div className="space-y-2">
            <Label>Meeting Minutes / Discussion Summary</Label>
            <Textarea
              value={minutesContent}
              onChange={(e) => setMinutesContent(e.target.value)}
              placeholder="Write the meeting minutes here. Include discussions, topics covered, and key points..."
              rows={6}
            />
          </div>

          {/* Decisions Made */}
          <div className="space-y-2">
            <Label>Decisions Made</Label>
            <Textarea
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              placeholder="List any decisions that were made during the meeting..."
              rows={3}
            />
          </div>

          {/* Action Items */}
          <div className="space-y-2">
            <Label>Action Items</Label>
            <Textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="List action items with responsible persons and deadlines..."
              rows={3}
            />
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <Label>Next Steps</Label>
            <Textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="What are the next steps or follow-up items?"
              rows={3}
            />
          </div>

          {/* Download Button */}
          <Button onClick={generatePDF} className="w-full gap-2" size="lg">
            <Download className="h-4 w-4" />
            Download Meeting Minutes as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
