'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [hideWeekend, setHideWeekend] = useState(false);
  const [reduceWeekend, setReduceWeekend] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedHideWeekend = localStorage.getItem('hideWeekend') === 'true';
    const savedReduceWeekend = localStorage.getItem('reduceWeekend') === 'true';

    setHideWeekend(savedHideWeekend);
    setReduceWeekend(savedReduceWeekend);
  }, []);

  // Handle weekend hide change
  const handleHideWeekendChange = (checked: boolean) => {
    setHideWeekend(checked);
    if (checked) {
      setReduceWeekend(false);
    }
  };

  // Handle weekend reduce change
  const handleReduceWeekendChange = (checked: boolean) => {
    setReduceWeekend(checked);
    if (checked) {
      setHideWeekend(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);

    try {
      localStorage.setItem('hideWeekend', hideWeekend.toString());
      localStorage.setItem('reduceWeekend', reduceWeekend.toString());

      toast.success('설정이 저장되었습니다');
    } catch (error) {
      toast.error('설정 저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold">설정</h1>

      <div className="max-w-2xl space-y-6">
        {/* Calendar Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>캘린더 표시</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hide Weekend */}
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition cursor-pointer">
              <div className="flex-1">
                <Label className="text-sm font-semibold cursor-pointer">
                  토·일 날짜 박스 숨기기
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  주말의 날짜 박스를 완전히 숨깁니다
                </p>
              </div>
              <Switch
                checked={hideWeekend}
                onCheckedChange={handleHideWeekendChange}
              />
            </div>

            {/* Reduce Weekend */}
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition cursor-pointer">
              <div className="flex-1">
                <Label className="text-sm font-semibold cursor-pointer">
                  토·일 날짜 박스 줄이기
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  주말의 날짜 박스 크기를 줄입니다
                </p>
              </div>
              <Switch
                checked={reduceWeekend}
                onCheckedChange={handleReduceWeekendChange}
              />
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              참고: 두 옵션은 동시에 활성화할 수 없습니다
            </p>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
