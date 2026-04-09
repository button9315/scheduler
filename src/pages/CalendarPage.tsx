'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Users,
  FolderKanban,
  UserPen,
  Type,
  Heart,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScheduleEditDialog } from '@/components/ScheduleEditDialog';

import { useSchedules } from '@/hooks/useSchedules';
import { useProjects } from '@/hooks/useProjects';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useIsMobile } from '@/hooks/useIsMobile';

import {
  CATEGORY_COLORS,
  PROJECT_STATUS_COLORS,
  CATEGORY_LABELS,
  SCHEDULE_TYPE_LABELS,
} from '@/lib/constants';
import { getHoliday } from '@/lib/holidays';

type ScheduleData = any;

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { schedules, refetch: refetchSchedules } = useSchedules();
  const { projects } = useProjects();
  const { users } = useUsers();
  const { bookmarks } = useBookmarks();

  // State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [myProjectsOnly, setMyProjectsOnly] = useState(false);
  const [mySchedulesOnly, setMySchedulesOnly] = useState(false);
  const [fontSize, setFontSize] = useState<number>(() => {
    const stored = localStorage.getItem('calendarFontSize');
    return stored ? parseFloat(stored) : 1;
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Handle URL query parameters
  useEffect(() => {
    const scheduleId = searchParams.get('scheduleId');
    if (scheduleId) {
      setEditScheduleId(scheduleId);
      setShowEditDialog(true);
      // Find the schedule to navigate to its month
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (schedule) {
        const scheduleDate = parseISO(schedule.startDate);
        setCurrentMonth(new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), 1));
      }
    }
  }, [searchParams, schedules]);

  // Save font size to localStorage
  useEffect(() => {
    localStorage.setItem('calendarFontSize', fontSize.toString());
  }, [fontSize]);

  // Get all days to display in calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weekStart = startOfWeek(monthStart, { locale: ko });
    const weekEnd = endOfWeek(monthEnd, { locale: ko });

    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentMonth]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      // Filter by selected user
      if (selectedUser && schedule.userId !== selectedUser) {
        return false;
      }

      // Filter by my projects
      if (myProjectsOnly && schedule.projectId) {
        const project = projects.find((p) => p.id === schedule.projectId);
        if (!project || project.userId !== user?.id) {
          return false;
        }
      }

      // Filter by my schedules
      if (mySchedulesOnly && schedule.userId !== user?.id) {
        return false;
      }

      return true;
    });
  }, [schedules, selectedUser, myProjectsOnly, mySchedulesOnly, projects, user?.id]);

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, typeof schedules> = {};

    filteredSchedules.forEach((schedule) => {
      const startDate = format(parseISO(schedule.startDate), 'yyyy-MM-dd');
      if (!grouped[startDate]) {
        grouped[startDate] = [];
      }
      grouped[startDate].push(schedule);
    });

    return grouped;
  }, [filteredSchedules]);

  // Navigation handlers
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
  };

  // Font size adjustment
  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 0.1, 1.25));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 0.1, 0.75));
  };

  // Cell click handler
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    setEditScheduleId(null);
    setShowEditDialog(true);
  };

  const handleScheduleClick = (scheduleId: string) => {
    setEditScheduleId(scheduleId);
    setSelectedDate(null);
    setShowEditDialog(true);
  };

  // Month picker months
  const monthPickerMonths = useMemo(() => {
    const months = [];
    for (let i = -12; i <= 12; i++) {
      const month = addMonths(currentMonth, i);
      months.push({
        value: month.getMonth(),
        label: format(month, 'yyyy년 M월', { locale: ko }),
        date: month,
      });
    }
    return months;
  }, [currentMonth]);

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
        {/* Left: Navigation and Month Display */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Today Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="h-7 md:h-8"
                >
                  <CalendarCheck className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">오늘</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>오늘로 이동</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Previous/Next Month Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-7 md:h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="h-7 md:h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Month Display with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="font-bold md:text-[1.3rem] text-[1rem] h-auto px-2 py-1"
              >
                {format(currentMonth, 'yyyy년 M월', { locale: ko })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start">
              <div className="max-h-[280px] overflow-y-auto">
                {monthPickerMonths.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => {
                      handleMonthSelect(m.value);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition ${
                      isSameDay(m.date, currentMonth)
                        ? 'bg-pink-100/50'
                        : ''
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right: Filters and Font Size */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Member Filter */}
          <Select value={selectedUser || 'all'} onValueChange={(value) => setSelectedUser(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[80px] md:w-[100px] h-8 text-xs md:text-sm">
              <Users className="w-4 h-4 mr-1" />
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* My Projects Only Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={myProjectsOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMyProjectsOnly(!myProjectsOnly)}
                  className="h-8 px-2 text-xs md:text-sm"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">내플젝만</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>내 프로젝트만 표시</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* My Schedules Only Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mySchedulesOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMySchedulesOnly(!mySchedulesOnly)}
                  className="h-8 px-2 text-xs md:text-sm"
                >
                  <UserPen className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">내등록만</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>내가 등록한 일정만 표시</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Font Size Control (Desktop Only) */}
          {!isMobile && (
            <div className="flex items-center gap-1 border border-border rounded-md px-2 h-8">
              <button
                onClick={decreaseFontSize}
                className="text-muted-foreground hover:text-foreground transition text-xs"
              >
                A
              </button>
              <Type className="w-3 h-3 text-muted-foreground" />
              <button
                onClick={increaseFontSize}
                className="text-foreground hover:text-foreground transition text-sm font-bold"
              >
                A
              </button>
              <span className="text-xs text-muted-foreground ml-1">{(fontSize * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="flex-1 grid gap-px bg-border rounded-lg overflow-hidden border border-border"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {/* Day Headers */}
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
          const dayNum = index;
          const isWeekend = dayNum === 0 || dayNum === 6;
          const color = dayNum === 0 ? 'text-destructive' : dayNum === 6 ? 'text-primary' : 'text-muted-foreground';

          return (
            <div
              key={day}
              className={`bg-background p-2 md:p-3 font-bold text-sm md:text-base text-center ${color}`}
            >
              {day}
            </div>
          );
        })}

        {/* Date Cells */}
        {calendarDays.map((date, index) => {
          const isWeekend = getDay(date) === 0 || getDay(date) === 6;
          const dayNum = date.getDate();
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isTodayDate = isToday(date);
          const dayOfWeek = getDay(date);

          const dateStr = format(date, 'yyyy-MM-dd');
          const daySchedules = schedulesByDate[dateStr] || [];

          // Holiday check
          const holiday = getHoliday(date);

          // Family Day check (1st and 3rd Friday)
          const isFamilyDay =
            dayOfWeek === 5 &&
            (Math.ceil(dayNum / 7) === 1 || Math.ceil(dayNum / 7) === 3);

          // Determine date display text
          let dateDisplay: string;
          if (dayNum === 1 || dayOfWeek === 0) {
            dateDisplay = format(date, 'M/d', { locale: ko });
          } else {
            dateDisplay = dayNum.toString();
          }

          // Determine date text color
          let dateColor = 'text-foreground';
          if (!isCurrentMonth) {
            dateColor = 'text-muted-foreground/40';
          } else if (dayOfWeek === 0 || holiday) {
            dateColor = 'text-destructive';
          } else if (dayOfWeek === 6) {
            dateColor = 'text-primary';
          }

          return (
            <div
              key={dateStr}
              onClick={() => handleDateClick(date)}
              className={`
                relative min-h-[120px] md:min-h-[150px] bg-background p-1 md:p-2 border-t border-r border-border cursor-pointer
                hover:bg-muted/50 transition
                ${isWeekend ? 'bg-muted/30' : ''}
                ${isTodayDate ? 'ring-2 ring-inset ring-pink-300' : ''}
              `}
            >
              {/* Today Heart Background */}
              {isTodayDate && (
                <Heart
                  className="absolute inset-0 w-full h-full"
                  fill="hsl(340,70%,85%)"
                  stroke="none"
                  style={{ opacity: 0.6 }}
                />
              )}

              {/* Date Number */}
              <div className={`relative z-10 text-[11px] md:text-sm font-semibold mb-1 ${dateColor}`}>
                {dateDisplay}
              </div>

              {/* Holiday Badge */}
              {holiday && (
                <div
                  className="relative z-10 inline-block border-2 rounded text-[0.55em] md:text-[0.7em] font-bold px-1 py-px mb-1"
                  style={{
                    borderColor: 'hsl(0,70%,55%)',
                    color: 'hsl(0,70%,55%)',
                  }}
                >
                  {holiday.isSubstitute ? '대체' : holiday.name}
                </div>
              )}

              {/* Family Day Badge */}
              {isFamilyDay && !holiday && (
                <div
                  className="relative z-10 inline-block border-2 rounded text-[0.55em] md:text-[0.7em] font-bold px-1 py-px mb-1 ml-1"
                  style={{
                    borderColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  가정의날
                </div>
              )}

              {/* Schedules */}
              <div className="relative z-10 space-y-0.5">
                {daySchedules.slice(0, isMobile ? 2 : 3).map((schedule) => (
                  <ScheduleBadge
                    key={schedule.id}
                    schedule={schedule}
                    isMobile={isMobile}
                    fontSize={fontSize}
                    isBookmarked={bookmarks.has(schedule.id)}
                    onScheduleClick={() => handleScheduleClick(schedule.id)}
                  />
                ))}
                {daySchedules.length > (isMobile ? 2 : 3) && (
                  <div className="text-[0.55em] md:text-[0.7em] text-muted-foreground">
                    +{daySchedules.length - (isMobile ? 2 : 3)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Edit Dialog */}
      <ScheduleEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        scheduleId={editScheduleId}
        defaultDate={selectedDate}
        onSaved={() => {
          setShowEditDialog(false);
          setEditScheduleId(null);
          setSelectedDate(null);
          refetchSchedules();
        }}
      />
    </div>
  );
}

/**
 * Inline Schedule Badge Component
 */
interface ScheduleBadgeProps {
  schedule: ScheduleData;
  isMobile: boolean;
  fontSize: number;
  isBookmarked: boolean;
  onScheduleClick: () => void;
}

function ScheduleBadge({
  schedule,
  isMobile,
  fontSize,
  isBookmarked,
  onScheduleClick,
}: ScheduleBadgeProps) {
  const { projects } = useProjects();
  const { users } = useUsers();

  // Determine badge color
  let badgeColor = 'hsl(0, 0%, 60%)';
  if (schedule.projectId) {
    const project = projects.find((p) => p.id === schedule.projectId);
    if (project) {
      badgeColor = PROJECT_STATUS_COLORS[project.status] || PROJECT_STATUS_COLORS['completed'];
    }
  } else {
    badgeColor = CATEGORY_COLORS[schedule.category] || CATEGORY_COLORS['other'];
  }

  // Get category or project label
  const label = schedule.projectId
    ? projects.find((p) => p.id === schedule.projectId)?.name ||
      SCHEDULE_TYPE_LABELS[schedule.type] ||
      '미분류'
    : CATEGORY_LABELS[schedule.category] || schedule.category;

  // Get schedule creator/assignee info
  const creator = users.find((u) => u.id === schedule.userId);

  // Tooltip content
  const tooltipContent = (
    <div className="space-y-2 text-sm">
      <div className="font-bold">{schedule.title}</div>
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="text-xs text-muted-foreground">
        {format(parseISO(schedule.startDate), 'yyyy년 M월 d일', { locale: ko })}
      </div>
      {schedule.type && (
        <div className="text-xs text-muted-foreground">{SCHEDULE_TYPE_LABELS[schedule.type]}</div>
      )}
      {creator && <div className="text-xs text-muted-foreground">담당: {creator.name}</div>}
      {schedule.description && <div className="text-xs line-clamp-2">{schedule.description}</div>}
      {isBookmarked && (
        <div className="text-xs text-yellow-600 flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          북마크됨
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onScheduleClick();
              }}
              className="w-full text-left block truncate"
            >
              <span
                className="inline-block font-bold px-1 py-px rounded leading-none border"
                style={{
                  borderColor: badgeColor,
                  color: badgeColor,
                  backgroundColor: badgeColor + '26',
                  fontSize: `${fontSize * 0.6}em`,
                }}
              >
                {label}
              </span>
              <span
                className="ml-1 truncate"
                style={{ fontSize: `${fontSize * 0.6}em` }}
              >
                {schedule.title}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="z-[99999]">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScheduleClick();
            }}
            className="w-full flex items-start gap-1 hover:opacity-80 transition"
          >
            <span
              className="font-bold px-1 py-px rounded leading-none border flex-shrink-0"
              style={{
                borderColor: badgeColor,
                color: badgeColor,
                backgroundColor: badgeColor + '26',
                fontSize: `${fontSize * 0.7}em`,
              }}
            >
              {label}
            </span>
            <span
              className="text-left line-clamp-1 flex-1"
              style={{ fontSize: `${fontSize * 0.85}em` }}
            >
              {schedule.title}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="z-[99999] max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
