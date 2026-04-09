'use client';

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/constants';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, refetch } = useProjects();
  const { users } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description &&
          project.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesUser = selectedUser === '' || project.userId === selectedUser;

      return matchesSearch && matchesUser;
    });
  }, [projects, searchTerm, selectedUser]);

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const handleEditProject = (projectId: string) => {
    navigate(`/projects/${projectId}/edit`);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await api.delete(`/projects/${projectToDelete}`);
      toast.success('프로젝트가 삭제되었습니다');
      setProjectToDelete(null);
      await refetch();
    } catch (error) {
      toast.error('프로젝트 삭제 실패');
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">프로젝트 목록</h1>
        <Button onClick={handleCreateProject} className="gap-2">
          <Plus className="w-4 h-4" />
          새 프로젝트
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="프로젝트명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* User Filter */}
        <Select value={selectedUser || 'all'} onValueChange={(v) => setSelectedUser(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="부서원" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 부서원</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">순번</TableHead>
              <TableHead>별칭</TableHead>
              <TableHead>프로젝트명</TableHead>
              <TableHead className="hidden md:table-cell">총괄PM</TableHead>
              <TableHead className="hidden md:table-cell">실무PM</TableHead>
              <TableHead className="hidden md:table-cell">AM</TableHead>
              <TableHead className="w-16 text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  프로젝트가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project, idx) => {
                const owner = users.find((u) => u.id === project.userId);
                const statusColor = PROJECT_STATUS_COLORS[project.status];

                return (
                  <TableRow key={project.id}>
                    <TableCell className="text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          borderColor: statusColor,
                          color: statusColor,
                          backgroundColor: statusColor + '26',
                        }}
                        variant="outline"
                      >
                        {project.name.substring(0, 3).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleEditProject(project.id)}
                        className="font-semibold hover:text-primary transition cursor-pointer"
                      >
                        {project.name}
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {owner?.name || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      -
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      -
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditProject(project.id)}
                          >
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setProjectToDelete(project.id)}
                            className="text-destructive"
                          >
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={projectToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProjectToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 관련된 모든 데이터가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
