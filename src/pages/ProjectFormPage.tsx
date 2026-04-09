'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { api } from '@/lib/api';
import { PROJECT_STATUS_LABELS } from '@/lib/constants';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { toast } from 'sonner';

interface Assignment {
  userId: string;
  role: 'pm' | 'pm2' | 'am';
}

interface Timeline {
  name: string;
  isDueDate: boolean;
  startDate?: string;
  dueDate?: string;
}

export default function ProjectFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { projects, refetch } = useProjects();
  const { users } = useUsers();

  const isEditing = !!id;
  const existingProject = id
    ? projects.find((p) => p.id === id)
    : null;

  // Form state
  const [name, setName] = useState(existingProject?.name || '');
  const [abbreviation, setAbbreviation] = useState('');
  const [status, setStatus] = useState(
    existingProject?.status || 'waiting'
  );
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timelines, setTimelines] = useState<Timeline[]>([
    { name: '', isDueDate: false },
  ]);

  const [selectedUserForAdd, setSelectedUserForAdd] = useState('');
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<'pm' | 'pm2' | 'am'>('pm');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing project data
  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name);
      setAbbreviation(existingProject.name.substring(0, 3).toUpperCase());
      setStatus(existingProject.status);
    }
  }, [existingProject]);

  // Handle add assignment
  const handleAddAssignment = () => {
    if (!selectedUserForAdd) {
      toast.error('부서원을 선택하세요');
      return;
    }

    if (assignments.some((a) => a.userId === selectedUserForAdd)) {
      toast.error('이미 추가된 부서원입니다');
      return;
    }

    setAssignments([
      ...assignments,
      { userId: selectedUserForAdd, role: selectedRoleForAdd },
    ]);
    setSelectedUserForAdd('');
  };

  // Handle remove assignment
  const handleRemoveAssignment = (userId: string) => {
    setAssignments(assignments.filter((a) => a.userId !== userId));
  };

  // Handle add timeline
  const handleAddTimeline = () => {
    setTimelines([...timelines, { name: '', isDueDate: false }]);
  };

  // Handle remove timeline
  const handleRemoveTimeline = (index: number) => {
    if (timelines.length === 1) {
      toast.error('최소 1개의 타임라인은 필요합니다');
      return;
    }
    setTimelines(timelines.filter((_, i) => i !== index));
  };

  // Handle timeline change
  const handleTimelineChange = (
    index: number,
    key: keyof Timeline,
    value: any
  ) => {
    const newTimelines = [...timelines];
    newTimelines[index] = { ...newTimelines[index], [key]: value };
    setTimelines(newTimelines);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('프로젝트명을 입력하세요');
      return;
    }

    if (!abbreviation.trim()) {
      toast.error('약칭을 입력하세요');
      return;
    }

    // Validate timelines
    for (const timeline of timelines) {
      if (!timeline.name.trim()) {
        toast.error('모든 타임라인 항목명을 입력하세요');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        name,
        status,
        abbreviation,
        assignments,
        timelines,
      };

      if (isEditing && id) {
        await api.put(`/projects/${id}`, projectData);
        toast.success('프로젝트가 수정되었습니다');
      } else {
        await api.post('/projects', projectData);
        toast.success('프로젝트가 생성되었습니다');
      }

      await refetch();
      navigate('/projects');
    } catch (error) {
      toast.error(
        isEditing ? '프로젝트 수정 실패' : '프로젝트 생성 실패'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold">
        {isEditing ? '프로젝트 수정' : '새 프로젝트'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                  프로젝트명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="프로젝트명 입력"
                  required
                />
              </div>
              <div>
                <Label htmlFor="abbrev" className="text-sm font-semibold mb-2 block">
                  약칭 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="abbrev"
                  value={abbreviation}
                  onChange={(e) =>
                    setAbbreviation(e.target.value.toUpperCase())
                  }
                  placeholder="예: ABC"
                  maxLength={5}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-semibold mb-2 block">
                상태
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiting">예정</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="completed">마감</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">담당자 배치</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select value={selectedUserForAdd} onValueChange={setSelectedUserForAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="부서원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedRoleForAdd}
                  onValueChange={(value) =>
                    setSelectedRoleForAdd(value as 'pm' | 'pm2' | 'am')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pm">총괄PM</SelectItem>
                    <SelectItem value="pm2">실무PM</SelectItem>
                    <SelectItem value="am">AM</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  onClick={handleAddAssignment}
                  variant="outline"
                >
                  추가
                </Button>
              </div>
            </div>

            {/* Assignment Badges */}
            {assignments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {assignments.map((assignment) => {
                  const user = users.find((u) => u.id === assignment.userId);
                  const roleLabel =
                    {
                      pm: '총괄PM',
                      pm2: '실무PM',
                      am: 'AM',
                    }[assignment.role] || assignment.role;

                  return (
                    <Badge
                      key={assignment.userId}
                      variant="secondary"
                      className="gap-2"
                    >
                      {user?.name} - {roleLabel}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveAssignment(assignment.userId)
                        }
                        className="hover:text-red-600 transition"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">타임라인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelines.map((timeline, index) => (
              <div key={index} className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    타임라인 {index + 1}
                  </Label>
                  {timelines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTimeline(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <Input
                  value={timeline.name}
                  onChange={(e) =>
                    handleTimelineChange(index, 'name', e.target.value)
                  }
                  placeholder="항목명 (예: 요구사항 수집)"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">
                      <input
                        type="radio"
                        name={`type-${index}`}
                        checked={!timeline.isDueDate}
                        onChange={() =>
                          handleTimelineChange(index, 'isDueDate', false)
                        }
                        className="mr-2"
                      />
                      기간
                    </Label>
                    {!timeline.isDueDate && (
                      <div className="grid grid-cols-2 gap-2">
                        <DatePickerButton
                          date={timeline.startDate}
                          onChange={(date) =>
                            handleTimelineChange(index, 'startDate', date)
                          }
                          placeholder="시작일"
                        />
                        <DatePickerButton
                          date={timeline.dueDate}
                          onChange={(date) =>
                            handleTimelineChange(index, 'dueDate', date)
                          }
                          placeholder="종료일"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">
                      <input
                        type="radio"
                        name={`type-${index}`}
                        checked={timeline.isDueDate}
                        onChange={() =>
                          handleTimelineChange(index, 'isDueDate', true)
                        }
                        className="mr-2"
                      />
                      당일
                    </Label>
                    {timeline.isDueDate && (
                      <DatePickerButton
                        date={timeline.dueDate}
                        onChange={(date) =>
                          handleTimelineChange(index, 'dueDate', date)
                        }
                        placeholder="날짜 선택"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={handleAddTimeline}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              타임라인 추가
            </Button>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? '저장 중...'
              : isEditing
              ? '수정'
              : '등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface DatePickerButtonProps {
  date?: string;
  onChange: (date: string) => void;
  placeholder: string;
}

function DatePickerButton({
  date,
  onChange,
  placeholder,
}: DatePickerButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {date ? format(parseISO(date), 'yyyy-MM-dd') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={date ? parseISO(date) : undefined}
          onSelect={(newDate) => {
            if (newDate) {
              onChange(format(newDate, 'yyyy-MM-dd'));
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
