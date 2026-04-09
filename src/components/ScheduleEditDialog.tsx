'use client';

import React, { useState, useEffect } from 'react';
import { format, parse, isToday } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { Heart, Star, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS, SCHEDULE_TYPE_LABELS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, type Project } from '@/hooks/useProjects';
import { useUsers, type User } from '@/hooks/useUsers';
import { useBookmarks } from '@/hooks/useBookmarks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId?: string | null;
  defaultDate?: string | null;
  onSaved?: () => void;
}

interface ClockTimePickerProps {
  value?: string;
  onComplete?: (time: string) => void;
  onClear?: () => void;
}

const ClockTimePicker = React.forwardRef<HTMLDivElement, ClockTimePickerProps>(
  ({ value, onComplete, onClear }, ref) => {
    const [mode, setMode] = useState<'hour' | 'minute'>('hour');
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [hasTime, setHasTime] = useState(false);

    useEffect(() => {
      if (value) {
        const [h, m] = value.split(':').map(Number);
        setHour(h);
        setMinute(m);
        setHasTime(true);
      } else {
        setHasTime(false);
      }
    }, [value]);

    const handleHourSelect = (selected: number) => {
      setHour(selected);
      setMode('minute');
    };

    const handleMinuteSelect = (selected: number) => {
      setMinute(selected);
      if (onComplete) {
        const timeStr = `${String(selected === 60 ? 0 : hour).padStart(2, '0')}:${String(selected === 60 ? 0 : minute).padStart(2, '0')}`;
        onComplete(timeStr);
      }
      setHasTime(true);
    };

    const handleClear = () => {
      setHour(0);
      setMinute(0);
      setHasTime(false);
      setMode('hour');
      if (onClear) onClear();
    };

    const hourAngles = Array.from({ length: 24 }, (_, i) => ({
      value: i,
      angle: (i / 24) * 360 - 90,
      isOuter: i >= 12,
    }));

    const minuteAngles = [0, 10, 20, 30, 40, 50].map((m) => ({
      value: m,
      angle: (m / 60) * 360 - 90,
    }));

    const getClockHandAngle = () => {
      if (mode === 'hour') {
        return (hour / 24) * 360 - 90;
      } else {
        return (minute / 60) * 360 - 90;
      }
    };

    const getClockHandRadius = () => {
      if (mode === 'hour') {
        return hour >= 12 ? 52 : 80;
      } else {
        return 80;
      }
    };

    const handAngle = getClockHandAngle();
    const handRadius = getClockHandRadius();
    const endX = 100 + handRadius * Math.cos((handAngle * Math.PI) / 180);
    const endY = 100 + handRadius * Math.sin((handAngle * Math.PI) / 180);

    return (
      <div ref={ref} className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('hour')}
            className={cn(
              'text-2xl font-bold px-4 py-2 rounded',
              mode === 'hour' && 'bg-primary text-primary-foreground'
            )}
          >
            {String(hour).padStart(2, '0')}
          </button>
          <span className="text-2xl font-bold">:</span>
          <button
            onClick={() => setMode('minute')}
            className={cn(
              'text-2xl font-bold px-4 py-2 rounded',
              mode === 'minute' && 'bg-primary text-primary-foreground'
            )}
          >
            {String(minute).padStart(2, '0')}
          </button>
        </div>

        <svg
          viewBox="0 0 200 200"
          className="w-48 h-48"
          style={{ userSelect: 'none' }}
        >
          <circle cx="100" cy="100" r="95" fill="none" stroke="#e5e7eb" />

          {mode === 'hour' ? (
            <>
              {hourAngles.map((item) => {
                const x = 100 + (item.isOuter ? 80 : 52) * Math.cos((item.angle * Math.PI) / 180);
                const y = 100 + (item.isOuter ? 80 : 52) * Math.sin((item.angle * Math.PI) / 180);
                const isSelected =
                  (item.isOuter && item.value === hour) ||
                  (!item.isOuter && item.value === hour);

                return (
                  <g key={item.value}>
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill={isSelected ? 'hsl(var(--primary))' : '#e5e7eb'}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => handleHourSelect(item.value)}
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dy="0.35em"
                      className="text-xs font-semibold fill-current cursor-pointer select-none"
                      onClick={() => handleHourSelect(item.value)}
                    >
                      {item.value}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="3" fill="hsl(var(--primary))" />
            </>
          ) : (
            <>
              {minuteAngles.map((item) => {
                const x = 100 + 80 * Math.cos((item.angle * Math.PI) / 180);
                const y = 100 + 80 * Math.sin((item.angle * Math.PI) / 180);
                const isSelected = item.value === minute;

                return (
                  <g key={item.value}>
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill={isSelected ? 'hsl(var(--primary))' : '#e5e7eb'}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => handleMinuteSelect(item.value)}
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dy="0.35em"
                      className="text-xs font-semibold fill-current cursor-pointer select-none"
                      onClick={() => handleMinuteSelect(item.value)}
                    >
                      {item.value}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="3" fill="hsl(var(--primary))" />
            </>
          )}

          <line
            x1="100"
            y1="100"
            x2={endX}
            y2={endY}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          <circle
            cx={endX}
            cy={endY}
            r="4"
            fill="hsl(var(--primary))"
            opacity="0.2"
          />
        </svg>

        <Button
          variant="ghost"
          onClick={handleClear}
          className="text-muted-foreground"
        >
          미지정
        </Button>
      </div>
    );
  }
);

ClockTimePicker.displayName = 'ClockTimePicker';

export function ScheduleEditDialog({
  open,
  onOpenChange,
  scheduleId = null,
  defaultDate = null,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { users } = useUsers();
  const { bookmarks, toggleBookmark } = useBookmarks();

  const isEdit = !!scheduleId;

  // Form state
  const [date, setDate] = useState<Date | undefined>(
    defaultDate ? parse(defaultDate, 'yyyy-MM-dd', new Date()) : new Date()
  );
  const [time, setTime] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [viewOnly, setViewOnly] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [updaterName, setUpdaterName] = useState<string>('');

  // Fetch schedule if editing
  useEffect(() => {
    if (!isEdit) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/schedules/${scheduleId}`);
        const schedule = data.schedule;

        setDate(parse(schedule.date, 'yyyy-MM-dd', new Date()));
        setTime(schedule.time || '');
        setCategory(schedule.category || '');
        setProjectId(schedule.projectId || '');
        setScheduleType(schedule.scheduleType || '');
        setTitle(schedule.title || '');
        setLocation(schedule.location || '');
        setAttendees(schedule.attendees || []);
        setNotes(schedule.notes || '');
        setViewOnly(schedule.viewOnly || false);
        setCreatorName(schedule.creator?.name || '');
        setUpdaterName(schedule.updater?.name || '');
        setIsBookmarked(bookmarks.has(scheduleId));
      } catch (error) {
        toast.error('일정을 불러오는데 실패했습니다');
        console.error('Failed to fetch schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [isEdit, scheduleId, bookmarks]);

  // Update bookmark state when bookmarks change
  useEffect(() => {
    if (scheduleId) {
      setIsBookmarked(bookmarks.has(scheduleId));
    }
  }, [bookmarks, scheduleId]);

  // Auto-check view-only for personal category
  useEffect(() => {
    if (category === 'personal') {
      setViewOnly(true);
    }
  }, [category]);

  const sortedProjects = projects
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      ...p,
      displayName: p.abbreviation ? `[${p.abbreviation}] ${p.name}` : p.name,
    }));

  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    value: key,
    label,
  }));

  const scheduleTypeOptions = Object.entries(SCHEDULE_TYPE_LABELS).map(
    ([key, label]) => ({
      value: key,
      label,
    })
  );

  const selectedProjectName = sortedProjects.find(
    (p) => p.id === projectId
  )?.displayName;

  const departmentUsers = users.filter((u) =>
    u.department === user?.department && u.id !== user?.id
  );

  const handleAddAttendee = (userId: string) => {
    if (!attendees.includes(userId)) {
      setAttendees([...attendees, userId]);
    }
  };

  const handleRemoveAttendee = (userId: string) => {
    setAttendees(attendees.filter((id) => id !== userId));
  };

  const handleQuickSelect = (type: 'all' | 'leaders') => {
    let selectedUserIds: string[] = [];

    if (type === 'all') {
      selectedUserIds = departmentUsers.map((u) => u.id);
    } else if (type === 'leaders') {
      selectedUserIds = departmentUsers
        .filter((u) =>
          ['프로', '수석', '책임', '선임', '부서장', '본부장'].includes(
            u.position
          )
        )
        .map((u) => u.id);
    }

    setAttendees(Array.from(new Set([...attendees, ...selectedUserIds])));
  };

  const handleSave = async () => {
    if (!date || !scheduleType || !title) {
      toast.error('필수 항목을 입력해주세요');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');

    const payload = {
      date: dateStr,
      time: time || null,
      category: category || null,
      projectId: projectId || null,
      scheduleType,
      title,
      location: location || null,
      attendees: attendees.length > 0 ? attendees : null,
      notes: notes || null,
      viewOnly,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await api.put(`/api/schedules/${scheduleId}`, payload);
        toast.success('일정이 수정되었습니다');
      } else {
        await api.post('/api/schedules', payload);
        toast.success('일정이 등록되었습니다');
      }

      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (error) {
      toast.error('일정 저장에 실패했습니다');
      console.error('Failed to save schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/api/schedules/${scheduleId}`);
      toast.success('일정이 삭제되었습니다');
      setDeleteDialogOpen(false);
      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (error) {
      toast.error('일정 삭제에 실패했습니다');
      console.error('Failed to delete schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (scheduleId) {
      await toggleBookmark(scheduleId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '일정 수정' : '일정 등록'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date & Time */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-sm mb-2 block">날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {date
                      ? format(date, 'yyyy년 M월 d일 (EEE)', { locale: ko })
                      : 'Pick a date'}
                    {date && isToday(date) && (
                      <Heart className="ml-auto h-4 w-4 text-red-500 fill-red-500" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-[110px]">
              <Label className="text-sm mb-2 block">시간</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {time || '미지정'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <ClockTimePicker
                    value={time}
                    onComplete={setTime}
                    onClear={() => setTime('')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Category & Project */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="text-sm">
                분류
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className={cn(projectId && 'opacity-50')}
                >
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project" className="text-sm">
                프로젝트
              </Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger
                  id="project"
                  className={cn(category && 'opacity-50')}
                >
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {sortedProjects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule Type */}
          <div>
            <Label htmlFor="scheduleType" className="text-sm">
              일정 유형 <span className="text-red-500">*</span>
            </Label>
            <Select value={scheduleType} onValueChange={setScheduleType}>
              <SelectTrigger id="scheduleType">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {scheduleTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목을 입력하세요"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm">
              장소
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소를 입력하세요"
            />
          </div>

          {/* Attendees */}
          <div>
            <Label className="text-sm mb-2 block">참석자</Label>

            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('all')}
                className="h-6 text-[11px]"
              >
                부서원 전체(인턴 포함)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('leaders')}
                className="h-6 text-[11px]"
              >
                프로~부서장 전체
              </Button>
            </div>

            <Select>
              <SelectTrigger className="mb-2">
                <SelectValue placeholder="참석자 추가" />
              </SelectTrigger>
              <SelectContent>
                {departmentUsers.map((u) => (
                  <SelectItem
                    key={u.id}
                    value={u.id}
                    disabled={attendees.includes(u.id)}
                    onSelect={() => {
                      if (!attendees.includes(u.id)) {
                        handleAddAttendee(u.id);
                      }
                    }}
                  >
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {attendees.map((attendeeId) => {
                const attendeeUser = users.find((u) => u.id === attendeeId);
                return (
                  <Badge key={attendeeId} variant="secondary">
                    {attendeeUser?.name}
                    <button
                      onClick={() => handleRemoveAttendee(attendeeId)}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm">
              메모
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="메모를 입력하세요"
              className="min-h-[80px]"
            />
          </div>

          {/* View Only Checkbox */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox
              id="viewOnly"
              checked={viewOnly}
              onCheckedChange={(checked) => setViewOnly(checked === true)}
              disabled={category === 'personal'}
            />
            <Label htmlFor="viewOnly" className="text-sm cursor-pointer flex-1">
              나만보기
            </Label>
          </div>

          {/* Creator/Updater Info */}
          {isEdit && (
            <div className="text-xs text-muted-foreground pt-2">
              {creatorName && <div>작성자: {creatorName}</div>}
              {updaterName && <div>수정자: {updaterName}</div>}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {isEdit ? (
              <>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>일정을 삭제하시겠습니까?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>{title}</AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant={isBookmarked ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleBookmark}
                  disabled={loading}
                >
                  <Star
                    className={cn(
                      'h-4 w-4 mr-2',
                      isBookmarked && 'fill-yellow-400 text-yellow-400'
                    )}
                  />
                  북마크
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="newBookmark"
                  checked={isBookmarked}
                  onCheckedChange={(checked) => setIsBookmarked(checked === true)}
                />
                <Label htmlFor="newBookmark" className="text-sm cursor-pointer">
                  북마크
                </Label>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {isEdit ? '수정' : '등록'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
