'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import {
  Type,
  ArrowUp,
  Paintbrush,
  Palette,
  X,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { useMemos, Memo } from '@/hooks/useMemos';
import {
  MEMO_COLORS,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  FONT_COLOR_OPTIONS,
} from '@/lib/constants';
import { toast } from 'sonner';

export default function MemosPage() {
  const { memos, createMemo, updateMemo, deleteMemo } = useMemos();
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  // Get random color for new memo
  const getRandomColor = () => {
    const colors = Object.keys(MEMO_COLORS);
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Create new memo
  const handleCreateMemo = async () => {
    try {
      await createMemo({
        title: '새 메모',
        content: '',
        color: getRandomColor(),
        fontFamily: 'pretendard-medium',
        fontSize: 'medium',
        fontColor: 'black',
      });
      toast.success('메모가 생성되었습니다');
    } catch (error) {
      toast.error('메모 생성 실패');
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    (memoId: string, updates: Partial<Memo>) => {
      // Clear existing timeout
      if (saveTimeouts[memoId]) {
        clearTimeout(saveTimeouts[memoId]);
      }

      // Set new timeout
      const timeout = setTimeout(async () => {
        try {
          await updateMemo(memoId, updates);
        } catch (error) {
          console.error('Failed to save memo:', error);
        }
      }, 500);

      setSaveTimeouts((prev) => ({
        ...prev,
        [memoId]: timeout,
      }));
    },
    [updateMemo, saveTimeouts]
  );

  // Handle delete
  const handleDeleteMemo = async (memoId: string) => {
    try {
      await deleteMemo(memoId);
      toast.success('메모가 삭제되었습니다');
    } catch (error) {
      toast.error('메모 삭제 실패');
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">메모</h1>
        <Button onClick={handleCreateMemo} className="gap-2">
          <Plus className="w-4 h-4" />
          새 메모
        </Button>
      </div>

      {/* Memos Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
        {memos.map((memo) => (
          <MemoCard
            key={memo.id}
            memo={memo}
            onSave={(updates) => debouncedSave(memo.id, updates)}
            onDelete={() => handleDeleteMemo(memo.id)}
          />
        ))}

        {memos.length === 0 && (
          <div className="col-span-full flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              새 메모를 만들어 시작하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MemoCardProps {
  memo: Memo;
  onSave: (updates: Partial<Memo>) => void;
  onDelete: () => void;
}

function MemoCard({ memo, onSave, onDelete }: MemoCardProps) {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const colorStyle = MEMO_COLORS[memo.color] || MEMO_COLORS.yellow;

  // Get font style values
  const fontOption = FONT_OPTIONS.find((f) => f.value === memo.fontFamily);
  const fontSizeOption = FONT_SIZE_OPTIONS.find(
    (f) => f.value === memo.fontSize
  );
  const fontColorOption = FONT_COLOR_OPTIONS.find(
    (f) => f.value === memo.fontColor
  );

  const fontSizeClass = fontSizeOption?.class || 'text-lg';
  const fontColor = fontColorOption?.hex || '#1a1a1a';

  // Handle title change
  useEffect(() => {
    if (title !== memo.title) {
      const timer = setTimeout(() => {
        onSave({ title });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title, memo.title, onSave]);

  // Handle content change
  useEffect(() => {
    if (content !== memo.content) {
      const timer = setTimeout(() => {
        onSave({ content });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [content, memo.content, onSave]);

  const handleDeleteMemo = () => {
    if (
      confirm(
        '정말로 이 메모를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      onDelete();
    }
  };

  const handleColorChange = (newColor: string) => {
    onSave({ color: newColor });
  };

  const handleFontChange = (newFont: string) => {
    onSave({ fontFamily: newFont });
  };

  const handleFontSizeChange = (newSize: string) => {
    onSave({ fontSize: newSize });
  };

  const handleFontColorChange = (newColor: string) => {
    onSave({ fontColor: newColor });
  };

  return (
    <div
      className={`${colorStyle.bg} h-56 rounded-xl border-2 ${colorStyle.border} shadow-sm flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className={`${colorStyle.header} px-3 py-2 flex items-center gap-2`}>
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onClick={() => setIsEditingTitle(true)}
          onBlur={() => setIsEditingTitle(false)}
          className={`flex-1 bg-transparent font-bold text-sm focus:outline-none ${
            isEditingTitle ? 'border-b border-current' : ''
          }`}
        />

        {/* Font Type Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="폰트 선택"
            >
              <Type className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="end">
            <div className="space-y-1">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => handleFontChange(font.value)}
                  className={`w-full text-left px-2 py-1 rounded text-sm ${
                    memo.fontFamily === font.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Font Size Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="크기 선택"
            >
              <ArrowUp className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-2" align="end">
            <div className="space-y-1">
              {FONT_SIZE_OPTIONS.map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleFontSizeChange(size.value)}
                  className={`w-full text-left px-2 py-1 rounded text-sm ${
                    memo.fontSize === size.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Font Color Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="글자색 선택"
            >
              <Paintbrush className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="end">
            <div className="grid grid-cols-4 gap-2">
              {FONT_COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleFontColorChange(color.value)}
                  className={`w-6 h-6 rounded border-2 ${
                    memo.fontColor === color.value ? 'border-current' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Color Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="배경색 선택"
            >
              <Palette className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="end">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(MEMO_COLORS).map(([colorKey, colorValue]) => (
                <button
                  key={colorKey}
                  onClick={() => handleColorChange(colorKey)}
                  className={`w-8 h-8 rounded border-2 ${
                    memo.color === colorKey ? 'border-current border-2' : 'border-gray-300'
                  } ${colorValue.bg}`}
                  title={colorKey}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Delete Button */}
        <button
          onClick={handleDeleteMemo}
          className="p-1 hover:bg-red-200 rounded transition"
          title="삭제"
        >
          <X className="w-3 h-3 text-red-600" />
        </button>
      </div>

      {/* Body */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`flex-1 bg-transparent p-3 resize-none focus:outline-none text-sm ${fontSizeClass}`}
        style={{ color: fontColor }}
        placeholder="메모를 입력하세요..."
      />

      {/* Footer */}
      {content && (
        <div className="px-3 py-1 text-xs text-muted-foreground border-t">
          {format(new Date(memo.updatedAt), 'M/d(eee) HH:mm', { locale: ko })}
        </div>
      )}
    </div>
  );
}
