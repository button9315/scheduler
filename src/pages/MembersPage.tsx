'use client';

import { useState, useMemo } from 'react';
import { Trash2, Edit3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import {
  POSITION_ORDER,
  POSITION_COLORS,
} from '@/lib/constants';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function MembersPage() {
  const { users, refetch } = useUsers();
  const { projects } = useProjects();
  const { user: currentUser } = useAuth();

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Sort users by position
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const orderA = POSITION_ORDER[a.position] ?? 999;
      const orderB = POSITION_ORDER[b.position] ?? 999;
      return orderA - orderB;
    });
  }, [users]);

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      await api.put(`/users/${editingUser.id}`, {
        name: editingUser.name,
        position: editingUser.position,
      });
      toast.success('부서원 정보가 수정되었습니다');
      setShowEditDialog(false);
      setEditingUser(null);
      await refetch();
    } catch (error) {
      toast.error('수정 실패');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete}`);
      toast.success('부서원이 삭제되었습니다');
      setUserToDelete(null);
      await refetch();
    } catch (error) {
      toast.error('삭제 실패');
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      await api.put(`/users/${userId}/admin`, {
        isAdmin: !currentAdmin,
      });
      toast.success('관리자 권한이 업데이트되었습니다');
      await refetch();
    } catch (error) {
      toast.error('권한 업데이트 실패');
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">부서원 관리</h1>
        <p className="text-sm text-muted-foreground">
          총 {users.length}명의 부서원
        </p>
      </div>

      {/* Members Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {sortedUsers.map((user) => (
          <MemberCard
            key={user.id}
            user={user}
            isCurrentUser={user.id === currentUser?.id}
            projects={projects}
            onEdit={() => handleEditUser(user)}
            onDelete={() => setUserToDelete(user.id)}
            onToggleAdmin={() =>
              handleToggleAdmin(user.id, user.role === 'admin')
            }
          />
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서원 정보 수정</DialogTitle>
            <DialogDescription>
              부서원의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-semibold">이메일</Label>
                <Input
                  value={editingUser.email}
                  disabled
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">이름</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">직급</Label>
                <Select
                  value={editingUser.position}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, position: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(POSITION_ORDER).map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  취소
                </Button>
                <Button onClick={handleSaveEdit}>저장</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={userToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>부서원을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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

interface MemberCardProps {
  user: any;
  isCurrentUser: boolean;
  projects: any[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleAdmin: () => void;
}

function MemberCard({
  user,
  isCurrentUser,
  projects,
  onEdit,
  onDelete,
  onToggleAdmin,
}: MemberCardProps) {
  const positionColor = POSITION_COLORS[user.position];
  const isAdmin = user.role === 'admin';

  // Get active projects
  const activeProjects = projects
    .filter((p) => p.status === 'in_progress' || p.status === 'waiting')
    .slice(0, 5);

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{user.name}</h3>
          <div className="flex gap-2 mt-2">
            <Badge
              style={{
                backgroundColor: positionColor,
                color: '#000',
              }}
              variant="outline"
            >
              {user.position}
            </Badge>
            {isAdmin && <Badge variant="secondary">관리자</Badge>}
          </div>
        </div>
      </div>

      {/* Admin Actions (Desktop) */}
      {isCurrentUser && (
        <div className="hidden md:flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            수정
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleAdmin}
            className="flex-1"
          >
            {isAdmin ? '관리자 취소' : '관리자'}
          </Button>
        </div>
      )}

      {/* Email */}
      <div className="text-xs text-muted-foreground break-all">
        {user.email}
      </div>

      {/* Roles Section */}
      <div className="space-y-2 pt-2">
        <p className="text-xs font-semibold text-muted-foreground">
          담당 역할
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="font-semibold">PM</div>
            <div className="text-2xl font-bold text-primary">0</div>
          </div>
          <div>
            <div className="font-semibold">APM</div>
            <div className="text-2xl font-bold text-primary">0</div>
          </div>
          <div>
            <div className="font-semibold">AM</div>
            <div className="text-2xl font-bold text-primary">0</div>
          </div>
        </div>
      </div>

      {/* Colleagues Section */}
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs font-semibold text-muted-foreground">
          협업 중인 동료
        </p>
        <p className="text-sm text-muted-foreground">
          아직 협업 데이터가 없습니다
        </p>
      </div>

      {/* Projects Section */}
      {activeProjects.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground">
            프로젝트 ({activeProjects.length})
          </p>
          <div className="space-y-1">
            {activeProjects.map((project) => (
              <Badge key={project.id} variant="secondary" className="text-xs">
                {project.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Actions */}
      {isCurrentUser && (
        <div className="flex gap-2 md:hidden pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            className="flex-1"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </Card>
  );
}
