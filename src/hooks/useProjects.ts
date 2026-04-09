import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: string;
  category: string;
  abbreviation?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get('/projects');
      setProjects(Array.isArray(data) ? data : (data.projects || []));
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  return {
    projects,
    loading,
    refetch: fetchProjects,
  };
}
