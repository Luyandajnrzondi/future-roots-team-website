'use client';

import { useMemo } from 'react';
import { Attendance, TeamMember } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContributionCalendarProps {
  attendance: Attendance[];
  member?: TeamMember;
  year?: number;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

export function ContributionCalendar({ attendance, member, year = new Date().getFullYear() }: ContributionCalendarProps) {
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach((a) => {
      map.set(a.date, a);
    });
    return map;
  }, [attendance]);

  const weeks = useMemo(() => {
    const result: { date: Date; dateStr: string }[][] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Adjust start date to the previous Sunday
    const firstDay = new Date(startDate);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());
    
    let currentWeek: { date: Date; dateStr: string }[] = [];
    const current = new Date(firstDay);
    
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
    
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [year]);

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]?.date;
      if (firstDayOfWeek && firstDayOfWeek.getFullYear() === year) {
        const month = firstDayOfWeek.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks, year]);

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-fit">
          {/* Month labels */}
          <div className="flex mb-2 text-xs text-muted-foreground pl-10">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-center"
                style={{
                  marginLeft: i === 0 ? label.weekIndex * 14 : (monthLabels[i].weekIndex - monthLabels[i - 1].weekIndex - 1) * 14,
                  width: '42px',
                }}
              >
                {label.month}
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            {/* Day of week labels */}
            <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pr-2">
              {DAYS_OF_WEEK.map((day, i) => (
                <div key={day} className="h-[12px] flex items-center justify-end" style={{ display: i % 2 === 1 ? 'flex' : 'none' }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => {
                    const record = attendanceMap.get(day.dateStr);
                    const isCurrentYear = day.date.getFullYear() === year;
                    const isFuture = day.date > new Date();
                    
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-[12px] h-[12px] rounded-sm transition-colors',
                              isCurrentYear && !isFuture
                                ? getStatusColor(record?.status)
                                : 'bg-transparent',
                              isCurrentYear && !isFuture && 'hover:ring-2 hover:ring-primary/50'
                            )}
                          />
                        </TooltipTrigger>
                        {isCurrentYear && !isFuture && (
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-medium">{day.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              <p className="text-muted-foreground">{getStatusLabel(record?.status)}</p>
                              {record?.notes && <p className="italic">{record.notes}</p>}
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
              <div className="w-[12px] h-[12px] rounded-sm bg-gray-200" />
              <div className="w-[12px] h-[12px] rounded-sm bg-[#8cbf85]" />
              <div className="w-[12px] h-[12px] rounded-sm bg-[#6b9d64]" />
              <div className="w-[12px] h-[12px] rounded-sm bg-[#2d5a27]" />
            </div>
            <span>More</span>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-[12px] h-[12px] rounded-sm bg-red-400" />
              <span>Absent</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
