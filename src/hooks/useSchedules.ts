import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export interface Schedule {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  category: string;
  type: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseSchedulesReturn {
  schedules: Schedule[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useSchedules(): UseSchedulesReturn {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    if (!user) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get('/schedules');
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  return {
    schedules,
    loading,
    refetch: fetchSchedules,
  };
}
