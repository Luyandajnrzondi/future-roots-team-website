'use client';

import { useMemo, useState } from 'react';
import { Attendance, TeamMember } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContributionCalendarProps {
  attendance: Attendance[];
  member?: TeamMember;
  year?: number;
  onYearChange?: (year: number) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getStatusColor(status: string | undefined) {
  switch (status) {
    case 'present':
      return 'bg-[#2d5a27]';
    case 'late':
      return 'bg-[#6b9d64]';
    case 'excused':
      return 'bg-[#8cbf85]';
    case 'absent':
      return 'bg-red-400';
    default:
      return 'bg-gray-200';
  }
}

function getStatusLabel(status: string | undefined) {
  switch (status) {
    case 'present':
      return 'Present';
    case 'late':
      return 'Late';
    case 'excused':
      return 'Excused';
    case 'absent':
      return 'Absent';
    default:
      return 'No record';
  }
}

function getDaysInYear(year: number) {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

export function ContributionCalendar({ 
  attendance, 
  member, 
  year: initialYear = new Date().getFullYear(),
  onYearChange 
}: ContributionCalendarProps) {
  const [year, setYear] = useState(initialYear);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    onYearChange?.(newYear);
  };

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach((a) => {
      map.set(a.date, a);
    });
    return map;
  }, [attendance]);

  // Generate all 365/366 days of the year organized by weeks
  const weeks = useMemo(() => {
    const result: { date: Date; dateStr: string }[][] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Start from the first Sunday on or before Jan 1
    const firstDay = new Date(startDate);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());
    
    let currentWeek: { date: Date; dateStr: string }[] = [];
    const current = new Date(firstDay);
    
    // Continue until we've covered all days including completing the last week
    while (current <= endDate || currentWeek.length > 0) {
      const dateStr = current.toISOString().split('T')[0];
      currentWeek.push({ date: new Date(current), dateStr });
      
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
      
      if (current > endDate && currentWeek.length === 0) break;
    }
    
    // Add any remaining days in the last week
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [year]);

  // Calculate month label positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      // Find the first day of this week that's in the current year
      const dayInYear = week.find(d => d.date.getFullYear() === year);
      if (dayInYear) {
        const month = dayInYear.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks, year]);

  const totalDays = getDaysInYear(year);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate attendance stats
  const stats = useMemo(() => {
    let present = 0, late = 0, excused = 0, absent = 0;
    attendance.forEach(a => {
      if (a.status === 'present') present++;
      else if (a.status === 'late') late++;
      else if (a.status === 'excused') excused++;
      else if (a.status === 'absent') absent++;
    });
    return { present, late, excused, absent, total: present + late + excused + absent };
  }, [attendance]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Year selector and stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange(year - 1)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[60px] text-center">{year}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange(year + 1)}
              disabled={year >= new Date().getFullYear()}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground ml-2">
              ({totalDays} days)
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#2d5a27]" />
              <span className="text-muted-foreground">Present: {stats.present}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#6b9d64]" />
              <span className="text-muted-foreground">Late: {stats.late}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#8cbf85]" />
              <span className="text-muted-foreground">Excused: {stats.excused}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-400" />
              <span className="text-muted-foreground">Absent: {stats.absent}</span>
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-fit">
            {/* Month labels */}
            <div className="flex mb-2 text-xs text-muted-foreground pl-8">
              {monthLabels.map((label, i) => (
                <div
                  key={`${label.month}-${i}`}
                  className="text-center"
                  style={{
                    marginLeft: i === 0 
                      ? label.weekIndex * 13 
                      : (label.weekIndex - monthLabels[i - 1].weekIndex) * 13 - 28,
                    minWidth: '28px',
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>
            
            <div className="flex gap-[2px]">
              {/* Day of week labels */}
              <div className="flex flex-col gap-[2px] text-[10px] text-muted-foreground pr-1 pt-0">
                <div className="h-[11px]"></div>
                <div className="h-[11px] flex items-center">Mon</div>
                <div className="h-[11px]"></div>
                <div className="h-[11px] flex items-center">Wed</div>
                <div className="h-[11px]"></div>
                <div className="h-[11px] flex items-center">Fri</div>
                <div className="h-[11px]"></div>
              </div>
              
              {/* Calendar grid - 53 weeks */}
              <div className="flex gap-[2px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px]">
                    {week.map((day, dayIndex) => {
                      const record = attendanceMap.get(day.dateStr);
                      const isCurrentYear = day.date.getFullYear() === year;
                      const isFuture = day.date > today;
                      const isToday = day.date.toDateString() === today.toDateString();
                      
                      return (
                        <Tooltip key={`${weekIndex}-${dayIndex}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-[11px] h-[11px] rounded-sm transition-all duration-200',
                                isCurrentYear && !isFuture
                                  ? getStatusColor(record?.status)
                                  : 'bg-transparent',
                                isCurrentYear && !isFuture && 'hover:ring-2 hover:ring-primary/50 cursor-pointer',
                                isToday && 'ring-2 ring-primary'
                              )}
                            />
                          </TooltipTrigger>
                          {isCurrentYear && !isFuture && (
                            <TooltipContent side="top" className="z-50">
                              <div className="text-xs">
                                <p className="font-medium">
                                  {day.date.toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                                <p className={cn(
                                  'mt-1',
                                  record?.status === 'present' && 'text-green-600',
                                  record?.status === 'late' && 'text-yellow-600',
                                  record?.status === 'excused' && 'text-blue-600',
                                  record?.status === 'absent' && 'text-red-600',
                                  !record && 'text-muted-foreground'
                                )}>
                                  {getStatusLabel(record?.status)}
                                </p>
                                {record?.notes && (
                                  <p className="italic text-muted-foreground mt-1">{record.notes}</p>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-[11px] h-[11px] rounded-sm bg-gray-200" title="No record" />
                <div className="w-[11px] h-[11px] rounded-sm bg-[#8cbf85]" title="Excused" />
                <div className="w-[11px] h-[11px] rounded-sm bg-[#6b9d64]" title="Late" />
                <div className="w-[11px] h-[11px] rounded-sm bg-[#2d5a27]" title="Present" />
              </div>
              <span>More</span>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-[11px] h-[11px] rounded-sm bg-red-400" />
                <span>Absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
