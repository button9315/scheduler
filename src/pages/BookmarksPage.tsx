'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  parseISO,
  isAfter,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useSchedules } from '@/hooks/useSchedules';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SCHEDULE_TYPE_LABELS,
  PROJECT_STATUS_COLORS,
} from '@/lib/constants';
import { getWeekLabel } from '@/lib/weekLabel';
import { toast } from 'sonner';

export default function BookmarksPage() {
  const { schedules } = useSchedules();
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { projects } = useProjects();
  const { users } = useUsers();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState<string | null>(null);
  const [scheduleToUnbookmark, setScheduleToUnbookmark] = useState<string | null>(
    null
  );

  // Get bookmarked schedules
  const bookmarkedSchedules = useMemo(() => {
    return schedules.filter((s) => bookmarks.has(s.id));
  }, [schedules, bookmarks]);

  // Filter by month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { currentMonthSchedules, pastSchedules } = useMemo(() => {
    const now = new Date();
    const current: typeof bookmarkedSchedules = [];
    const past: typeof bookmarkedSchedules = [];

    bookmarkedSchedules.forEach((schedule) => {
      const scheduleDate = parseISO(schedule.startDate);

      // Check if in current month
      if (scheduleDate >= monthStart && scheduleDate <= monthEnd) {
        if (isAfter(scheduleDate, now) || isToday(scheduleDate)) {
          current.push(schedule);
        } else {
          past.push(schedule);
        }
      }
    });

    return {
      currentMonthSchedules: current.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
      pastSchedules: past
        .sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
        .slice(0, 10),
    };
  }, [bookmarkedSchedules, monthStart, monthEnd]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToggleBookmark = async (scheduleId: string) => {
    try {
      await toggleBookmark(scheduleId);
    } catch (error) {
      toast.error('작업 중 오류가 발생했습니다');
    }
  };

  const handleConfirmUnbookmark = async () => {
    if (!scheduleToUnbookmark) return;

    try {
      await handleToggleBookmark(scheduleToUnbookmark);
      setScheduleToUnbookmark(null);
    } catch (error) {
      toast.error('작업 중 오류가 발생했습니다');
    }
  };

  const handleScheduleClick = (scheduleId: string) => {
    setEditScheduleId(scheduleId);
    setShowEditDialog(true);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <h1 className="text-2xl font-bold">찜한 일정</h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[120px] text-center">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {currentMonthSchedules.length === 0 && pastSchedules.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Star className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground text-center">
            이 달에 찜한 일정이 없습니다
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {/* Current/Upcoming */}
          {currentMonthSchedules.map((schedule) => (
            <BookmarkItem
              key={schedule.id}
              schedule={schedule}
              onUnbookmark={() => setScheduleToUnbookmark(schedule.id)}
              onClick={() => handleScheduleClick(schedule.id)}
              users={users}
              projects={projects}
            />
          ))}

          {/* Past Bookmarks */}
          {pastSchedules.length > 0 && (
            <>
              <div className="py-3 px-2 text-sm font-semibold text-muted-foreground sticky top-0 bg-background/80 backdrop-blur">
                지난 찜 일정
              </div>
              {pastSchedules.map((schedule) => (
                <BookmarkItem
                  key={schedule.id}
                  schedule={schedule}
                  onUnbookmark={() => setScheduleToUnbookmark(schedule.id)}
                  onClick={() => handleScheduleClick(schedule.id)}
                  users={users}
                  projects={projects}
                  isPast
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Unbookmark Confirmation Dialog */}
      <AlertDialog
        open={scheduleToUnbookmark !== null}
        onOpenChange={(open) => {
          if (!open) setScheduleToUnbookmark(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>찜을 제거하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 일정을 즐겨찾기에서 제거합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUnbookmark}>
              제거
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog Placeholder */}
      {showEditDialog && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>일정 수정</DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center text-muted-foreground">
              <p>일정 수정 기능이 추가 예정 중입니다.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface BookmarkItemProps {
  schedule: any;
  onUnbookmark: () => void;
  onClick: () => void;
  users: any[];
  projects: any[];
  isPast?: boolean;
}

function BookmarkItem({
  schedule,
  onUnbookmark,
  onClick,
  users,
  projects,
  isPast = false,
}: BookmarkItemProps) {
  const scheduleDate = parseISO(schedule.startDate);
  const weekLabel = getWeekLabel(scheduleDate);
  const user = users.find((u) => u.id === schedule.userId);
  const project = schedule.projectId
    ? projects.find((p) => p.id === schedule.projectId)
    : null;

  const categoryColor = project
    ? PROJECT_STATUS_COLORS[project.status]
    : CATEGORY_COLORS[schedule.category];

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition ${
        isPast ? 'opacity-50' : isToday(scheduleDate) ? 'bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-1 flex-shrink-0 hover:scale-110 transition"
          onClick={(e) => {
            e.stopPropagation();
            onUnbookmark();
          }}
        >
          <Star
            className="w-5 h-5"
            fill="#FCD34D"
            stroke="#FCD34D"
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {project && (
              <Badge
                style={{
                  borderColor: categoryColor,
                  color: categoryColor,
                  backgroundColor: categoryColor + '26',
                }}
                variant="outline"
              >
                {project.name}
              </Badge>
            )}
            {!project && (
              <Badge
                style={{
                  borderColor: categoryColor,
                  color: categoryColor,
                  backgroundColor: categoryColor + '26',
                }}
                variant="outline"
              >
                {CATEGORY_LABELS[schedule.category] || schedule.category}
              </Badge>
            )}
          </div>

          <h3 className="font-bold text-base mb-2">{schedule.title}</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            {/* Date */}
            <div>
              <div className="font-semibold">날짜</div>
              <div>
                {format(scheduleDate, 'M월 d일 (eeee)', { locale: ko })}
              </div>
            </div>

            {/* Week Label */}
            {weekLabel && (
              <div>
                <div className="font-semibold">주간</div>
                <Badge variant="secondary" className="text-xs w-fit">
                  {weekLabel}
                </Badge>
              </div>
            )}

            {/* Type */}
            {schedule.type && (
              <div>
                <div className="font-semibold">유형</div>
                <div>{SCHEDULE_TYPE_LABELS[schedule.type]}</div>
              </div>
            )}

            {/* User */}
            {user && (
              <div>
                <div className="font-semibold">담당</div>
                <div>{user.name}</div>
              </div>
            )}
          </div>

          {/* Description */}
          {schedule.description && (
            <div className="text-xs text-muted-foreground mt-2">
              {schedule.description}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
