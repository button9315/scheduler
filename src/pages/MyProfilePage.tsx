'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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

import { useAuth } from '@/hooks/useAuth';
import { POSITION_ORDER } from '@/lib/constants';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function MyProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [position, setPosition] = useState(user?.position || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('이름을 입력하세요');
      return;
    }

    if (!position.trim()) {
      toast.error('직급을 선택하세요');
      return;
    }

    setIsSavingProfile(true);

    try {
      await api.put('/auth/profile', { name, position });
      toast.success('프로필이 수정되었습니다');
    } catch (error) {
      toast.error('프로필 수정 실패');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('현재 비밀번호를 입력하세요');
      return;
    }

    if (!newPassword) {
      toast.error('새 비밀번호를 입력하세요');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('새 비밀번호는 6글자 이상이어야 합니다');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });
      toast.success('비밀번호가 변경되었습니다');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('현재 비밀번호가 잘못되었습니다');
      } else {
        toast.error('비밀번호 변경 실패');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold">내 정보</h1>

      <div className="max-w-2xl space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                  이름
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 입력"
                  required
                />
              </div>

              <div>
                <Label htmlFor="position" className="text-sm font-semibold mb-2 block">
                  직급
                </Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(POSITION_ORDER).map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="current-pw" className="text-sm font-semibold mb-2 block">
                  현재 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호 입력"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="new-pw" className="text-sm font-semibold mb-2 block">
                  새 비밀번호 (6글자 이상)
                </Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-pw" className="text-sm font-semibold mb-2 block">
                  비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-pw"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 확인"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
