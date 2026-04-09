'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  parseISO,
  isToday,
  isAfter,
} from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  CalendarIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useSchedules } from '@/hooks/useSchedules';
import { useProjects } from '@/hooks/useProjects';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useFilterFavorites } from '@/hooks/useFilterFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useIsMobile } from '@/hooks/useIsMobile';

import {
  CATEGORY_COLORS,
  PROJECT_STATUS_COLORS,
  CATEGORY_LABELS,
  SCHEDULE_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
} from '@/lib/constants';
import { getWeekLabel } from '@/lib/weekLabel';
import { toast } from 'sonner';

export default function ProjectSchedulesPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { schedules } = useSchedules();
  const { projects } = useProjects();
  const { users } = useUsers();
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { favorites, toggleFavorite, isFavorite } = useFilterFavorites();

  // State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState<string | null>(null);

  // Get unique categories, types, and projects
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    schedules.forEach((s) => cats.add(s.category));
    return Array.from(cats).sort();
  }, [schedules]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    schedules.forEach((s) => types.add(s.type));
    return Array.from(types).sort();
  }, [schedules]);

  const uniqueProjectIds = useMemo(() => {
    const projIds = new Set<string>();
    schedules.forEach((s) => {
      if (s.projectId) projIds.add(s.projectId);
    });
    return Array.from(projIds);
  }, [schedules]);

  // Filter schedules by selected filters
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const scheduleDate = parseISO(schedule.startDate);

      if (scheduleDate < monthStart || scheduleDate > monthEnd) {
        return false;
      }

      if (
        selectedCategories.size > 0 &&
        !selectedCategories.has(schedule.category)
      ) {
        return false;
      }

      if (selectedTypes.size > 0 && !selectedTypes.has(schedule.type)) {
        return false;
      }

      if (selectedProjects.size > 0 && !selectedProjects.has(schedule.projectId || '')) {
        return false;
      }

      return true;
    });
  }, [schedules, currentMonth, selectedCategories, selectedTypes, selectedProjects]);

  // Get the selected project (if only one is selected)
  const selectedProjectId = selectedProjects.size === 1
    ? Array.from(selectedProjects)[0]
    : null;

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  // Group schedules by timeline for project view
  const projectTimeline = useMemo(() => {
    if (!selectedProject) return [];

    const projectSchedules = filteredSchedules.filter(
      (s) => s.projectId === selectedProjectId
    );

    return projectSchedules.sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [filteredSchedules, selectedProject, selectedProjectId]);

  // Separate today/upcoming and past items
  const { todayAndUpcoming, past } = useMemo(() => {
    const now = new Date();
    const upcoming: typeof filteredSchedules = [];
    const pastItems: typeof filteredSchedules = [];

    filteredSchedules.forEach((schedule) => {
      const scheduleDate = parseISO(schedule.startDate);
      if (isAfter(scheduleDate, now) || isToday(scheduleDate)) {
        upcoming.push(schedule);
      } else {
        pastItems.push(schedule);
      }
    });

    return {
      todayAndUpcoming: upcoming.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
      past: pastItems
        .sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
        .slice(0, 10),
    };
  }, [filteredSchedules]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const toggleCategory = (category: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setSelectedCategories(newSet);
  };

  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const toggleProject = (projectId: string) => {
    const newSet = new Set(selectedProjects);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    setSelectedProjects(newSet);
  };

  const handleScheduleClick = (scheduleId: string) => {
    setEditScheduleId(scheduleId);
    setShowEditDialog(true);
  };

  const handleToggleBookmark = async (scheduleId: string) => {
    try {
      await toggleBookmark(scheduleId);
    } catch (error) {
      toast.error('북마크 처리 중 오류가 발생했습니다');
    }
  };

  // Render filter section
  const renderFilterSection = () => {
    if (isMobile && (selectedCategories.size > 0 || selectedTypes.size > 0 || selectedProjects.size > 0)) {
      return (
        <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
          {selectedCategories.size > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">카테고리</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedCategories).map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                    style={{
                      borderColor: CATEGORY_COLORS[cat],
                      color: CATEGORY_COLORS[cat],
                    }}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedTypes.size > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">유형</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedTypes).map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => toggleType(type)}
                  >
                    {SCHEDULE_TYPE_LABELS[type] || type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedProjects.size > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">프로젝트</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedProjects).map((projId) => {
                  const proj = projects.find((p) => p.id === projId);
                  return (
                    <Badge
                      key={projId}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => toggleProject(projId)}
                      style={{
                        borderColor: PROJECT_STATUS_COLORS[proj?.status || 'waiting'],
                        color: PROJECT_STATUS_COLORS[proj?.status || 'waiting'],
                      }}
                    >
                      {proj?.name || 'Unknown'}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Categories */}
        <div>
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            카테고리
          </p>
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((cat) => {
              const isSelected = selectedCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border-2 transition"
                  style={{
                    borderColor: CATEGORY_COLORS[cat],
                    color: isSelected ? 'white' : CATEGORY_COLORS[cat],
                    backgroundColor: isSelected ? CATEGORY_COLORS[cat] : 'transparent',
                  }}
                >
                  <Star
                    className="w-3 h-3"
                    fill={isFavorite(`cat_${cat}`) ? 'currentColor' : 'none'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(`cat_${cat}`);
                    }}
                  />
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Types */}
        <div>
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            일정 유형
          </p>
          <div className="flex flex-wrap gap-2">
            {uniqueTypes.map((type) => {
              const isSelected = selectedTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className="px-3 py-1 rounded-full border-2 transition"
                  style={{
                    borderColor: 'currentColor',
                    backgroundColor: isSelected ? '#ddd' : 'transparent',
                  }}
                >
                  <Star
                    className="w-3 h-3 inline mr-1"
                    fill={isFavorite(`type_${type}`) ? 'currentColor' : 'none'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(`type_${type}`);
                    }}
                  />
                  {SCHEDULE_TYPE_LABELS[type] || type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects */}
        <div>
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            프로젝트
          </p>
          <div className="flex flex-wrap gap-2">
            {uniqueProjectIds.map((projId) => {
              const proj = projects.find((p) => p.id === projId);
              const isSelected = selectedProjects.has(projId);
              if (!proj) return null;
              return (
                <button
                  key={projId}
                  onClick={() => toggleProject(projId)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border-2 transition"
                  style={{
                    borderColor: PROJECT_STATUS_COLORS[proj.status],
                    color: isSelected ? 'white' : PROJECT_STATUS_COLORS[proj.status],
                    backgroundColor: isSelected
                      ? PROJECT_STATUS_COLORS[proj.status]
                      : 'transparent',
                  }}
                >
                  <Star
                    className="w-3 h-3"
                    fill={isFavorite(`proj_${projId}`) ? 'currentColor' : 'none'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(`proj_${projId}`);
                    }}
                  />
                  {proj.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* Month Navigation */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-bold min-w-[160px]">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {renderFilterSection()}

      {/* Content */}
      {filteredSchedules.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <CalendarIcon className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            카테고리 또는 프로젝트를 선택하세요
          </p>
        </div>
      ) : selectedProject && selectedProjectId ? (
        // Project timeline view
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Timeline */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold">프로젝트 타임라인</h3>
            <div className="space-y-2 border-l-2 border-primary pl-4">
              {projectTimeline.map((schedule, idx) => (
                <div
                  key={schedule.id}
                  className="flex gap-3 cursor-pointer hover:opacity-80 transition"
                  onClick={() => handleScheduleClick(schedule.id)}
                >
                  <div className="w-3 h-3 rounded-full bg-primary -translate-x-[22px] translate-y-1" />
                  <div className="text-xs">
                    <div className="font-semibold">
                      {format(parseISO(schedule.startDate), 'M/d')}
                    </div>
                    <div className="text-muted-foreground line-clamp-1">
                      {schedule.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule List */}
          <div className="md:col-span-3 space-y-2 overflow-y-auto max-h-[600px]">
            {todayAndUpcoming.map((schedule) => (
              <ScheduleItem
                key={schedule.id}
                schedule={schedule}
                isBookmarked={bookmarks.has(schedule.id)}
                onToggleBookmark={() => handleToggleBookmark(schedule.id)}
                onClick={() => handleScheduleClick(schedule.id)}
                users={users}
                projects={projects}
              />
            ))}
            {past.length > 0 && (
              <>
                <div className="py-2 px-2 text-xs font-semibold text-muted-foreground">
                  지난 일정
                </div>
                {past.map((schedule) => (
                  <ScheduleItem
                    key={schedule.id}
                    schedule={schedule}
                    isBookmarked={bookmarks.has(schedule.id)}
                    onToggleBookmark={() => handleToggleBookmark(schedule.id)}
                    onClick={() => handleScheduleClick(schedule.id)}
                    users={users}
                    projects={projects}
                    isPast
                  />
                ))}
              </>
            )}
          </div>
        </div>
      ) : (
        // List view
        <div className="flex-1 space-y-2 overflow-y-auto">
          {todayAndUpcoming.map((schedule) => (
            <ScheduleItem
              key={schedule.id}
              schedule={schedule}
              isBookmarked={bookmarks.has(schedule.id)}
              onToggleBookmark={() => handleToggleBookmark(schedule.id)}
              onClick={() => handleScheduleClick(schedule.id)}
              users={users}
              projects={projects}
            />
          ))}
          {past.length > 0 && (
            <>
              <div className="py-2 px-2 text-xs font-semibold text-muted-foreground">
                지난 일정
              </div>
              {past.map((schedule) => (
                <ScheduleItem
                  key={schedule.id}
                  schedule={schedule}
                  isBookmarked={bookmarks.has(schedule.id)}
                  onToggleBookmark={() => handleToggleBookmark(schedule.id)}
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

interface ScheduleItemProps {
  schedule: any;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onClick: () => void;
  users: any[];
  projects: any[];
  isPast?: boolean;
}

function ScheduleItem({
  schedule,
  isBookmarked,
  onToggleBookmark,
  onClick,
  users,
  projects,
  isPast = false,
}: ScheduleItemProps) {
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
      className={`p-3 cursor-pointer hover:shadow-md transition ${
        isPast ? 'opacity-50' : isToday(scheduleDate) ? 'bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 flex-shrink-0 hover:scale-110 transition"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark();
          }}
        >
          <Star
            className="w-4 h-4"
            fill={isBookmarked ? '#FCD34D' : 'none'}
            stroke={isBookmarked ? '#FCD34D' : 'currentColor'}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <Badge
              style={{
                borderColor: categoryColor,
                color: categoryColor,
                backgroundColor: categoryColor + '26',
              }}
              variant="outline"
              className="text-xs flex-shrink-0"
            >
              {project
                ? project.name
                : CATEGORY_LABELS[schedule.category] || schedule.category}
            </Badge>
            {weekLabel && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {weekLabel}
              </Badge>
            )}
          </div>

          <h4 className="font-semibold text-sm line-clamp-1">{schedule.title}</h4>

          <div className="text-xs text-muted-foreground space-y-1 mt-1">
            <div>
              {format(scheduleDate, 'M월 d일 (eeee)', { locale: ko })}
            </div>
            {schedule.type && (
              <div>{SCHEDULE_TYPE_LABELS[schedule.type]}</div>
            )}
            {user && <div>담당: {user.name}</div>}
            {schedule.description && (
              <div className="line-clamp-1">{schedule.description}</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
