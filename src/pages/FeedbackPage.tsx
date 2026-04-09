'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { Send, Edit2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const { users } = useUsers();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  // Load feedbacks
  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        setIsLoading(true);
        const data = await api.get('/feedbacks');
        const sorted = (data.feedbacks || []).sort(
          (a: Feedback, b: Feedback) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setFeedbacks(sorted);
      } catch (error) {
        console.error('Failed to load feedbacks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedbacks();
  }, []);

  // Handle submit new feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFeedback.trim()) {
      toast.error('의견을 입력하세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await api.post('/feedbacks', { content: newFeedback });
      const sorted = [data.feedback, ...feedbacks].sort(
        (a: Feedback, b: Feedback) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setFeedbacks(sorted);
      setNewFeedback('');
      toast.success('의견이 등록되었습니다');
    } catch (error) {
      toast.error('의견 등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleStartEdit = (feedback: Feedback) => {
    setEditingId(feedback.id);
    setEditingContent(feedback.content);
  };

  const handleSaveEdit = async () => {
    if (!editingContent.trim()) {
      toast.error('의견을 입력하세요');
      return;
    }

    if (!editingId) return;

    try {
      const data = await api.put(`/feedbacks/${editingId}`, {
        content: editingContent,
      });

      const updated = feedbacks.map((f) =>
        f.id === editingId ? data.feedback : f
      );
      const sorted = updated.sort(
        (a: Feedback, b: Feedback) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setFeedbacks(sorted);
      setEditingId(null);
      setEditingContent('');
      toast.success('의견이 수정되었습니다');
    } catch (error) {
      toast.error('의견 수정 실패');
    }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;

    try {
      await api.delete(`/feedbacks/${feedbackToDelete}`);
      setFeedbacks(feedbacks.filter((f) => f.id !== feedbackToDelete));
      setFeedbackToDelete(null);
      toast.success('의견이 삭제되었습니다');
    } catch (error) {
      toast.error('의견 삭제 실패');
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">개선의견</h1>
        <p className="text-sm text-muted-foreground">
          애플리케이션 개선을 위한 의견을 제시합니다
        </p>
      </div>

      {/* Input Card */}
      <Card className="p-4">
        <form onSubmit={handleSubmitFeedback} className="space-y-3">
          <Textarea
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="개선의견을 입력하세요..."
            maxLength={1000}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newFeedback.length}/1000
            </span>
            <Button
              type="submit"
              disabled={isSubmitting || !newFeedback.trim()}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              등록
            </Button>
          </div>
        </form>
      </Card>

      {/* Feedbacks List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            로딩 중...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            아직 등록된 의견이 없습니다
          </div>
        ) : (
          feedbacks.map((feedback) => {
            const author = users.find((u) => u.id === feedback.userId);
            const isOwn = feedback.userId === user?.id;
            const isEditing = editingId === feedback.id;

            return (
              <Card key={feedback.id} className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-sm">
                          {author?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {author?.position || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(
                          parseISO(feedback.updatedAt),
                          'yyyy.MM.dd HH:mm',
                          { locale: ko }
                        )}
                      </span>
                      {feedback.updatedAt !== feedback.createdAt && (
                        <Badge variant="secondary" className="text-xs">
                          수정됨
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                        >
                          저장
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {feedback.content}
                    </p>
                  )}

                  {/* Actions */}
                  {isOwn && !isEditing && (
                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(feedback)}
                        className="gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFeedbackToDelete(feedback.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        삭제
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={feedbackToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFeedbackToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>의견을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
