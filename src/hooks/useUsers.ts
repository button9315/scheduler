import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';
import type { User } from './useAuth';

export type { User };

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get('/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  return {
    users,
    loading,
    refetch: fetchUsers,
  };
}
