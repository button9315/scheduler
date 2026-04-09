import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export interface Memo {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  fontFamily: string;
  fontSize: string;
  fontColor: string;
  createdAt: string;
  updatedAt: string;
}

interface UseMemosReturn {
  memos: Memo[];
  createMemo: (memo: Omit<Memo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Memo>;
  updateMemo: (id: string, memo: Partial<Memo>) => Promise<Memo>;
  deleteMemo: (id: string) => Promise<void>;
  loading: boolean;
}

export function useMemos(): UseMemosReturn {
  const { user } = useAuth();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemos = async () => {
    if (!user) {
      setMemos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get('/memos');
      setMemos(data.memos || []);
    } catch (error) {
      console.error('Failed to fetch memos:', error);
      setMemos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMemos();
    }
  }, [user]);

  const createMemo = async (memo: Omit<Memo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const data = await api.post('/memos', memo);
      const newMemo = data.memo;
      setMemos([...memos, newMemo]);
      return newMemo;
    } catch (error) {
      console.error('Failed to create memo:', error);
      throw error;
    }
  };

  const updateMemo = async (id: string, memo: Partial<Memo>) => {
    try {
      const data = await api.put(`/memos/${id}`, memo);
      const updatedMemo = data.memo;
      setMemos(memos.map((m) => (m.id === id ? updatedMemo : m)));
      return updatedMemo;
    } catch (error) {
      console.error('Failed to update memo:', error);
      throw error;
    }
  };

  const deleteMemo = async (id: string) => {
    try {
      await api.delete(`/memos/${id}`);
      setMemos(memos.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to delete memo:', error);
      throw error;
    }
  };

  return {
    memos,
    createMemo,
    updateMemo,
    deleteMemo,
    loading,
  };
}
