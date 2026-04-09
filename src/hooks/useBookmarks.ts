import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UseBookmarksReturn {
  bookmarks: Set<string>;
  toggleBookmark: (scheduleId: string) => Promise<void>;
  loading: boolean;
}

export function useBookmarks(): UseBookmarksReturn {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    if (!user) {
      setBookmarks(new Set());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get('/bookmarks');
      setBookmarks(new Set(data.bookmarks || []));
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      setBookmarks(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const toggleBookmark = async (scheduleId: string) => {
    const isBookmarked = bookmarks.has(scheduleId);
    const newBookmarks = new Set(bookmarks);

    if (isBookmarked) {
      newBookmarks.delete(scheduleId);
    } else {
      newBookmarks.add(scheduleId);
    }

    // Optimistic update
    setBookmarks(newBookmarks);

    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${scheduleId}`);
        toast.success('북마크를 제거했습니다');
      } else {
        await api.post(`/bookmarks/${scheduleId}`);
        toast.success('북마크에 추가했습니다');
      }
    } catch (error) {
      // Revert optimistic update on error
      setBookmarks(bookmarks);
      toast.error('작업을 실패했습니다');
      console.error('Failed to toggle bookmark:', error);
    }
  };

  return {
    bookmarks,
    toggleBookmark,
    loading,
  };
}
