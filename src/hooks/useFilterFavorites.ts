import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

interface FilterFavorite {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface UseFilterFavoritesReturn {
  favorites: FilterFavorite[];
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

export function useFilterFavorites(): UseFilterFavoritesReturn {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FilterFavorite[]>([]);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      const data = await api.get('/filter-favorites');
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch filter favorites:', error);
      setFavorites([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const toggleFavorite = async (id: string) => {
    const isFav = favorites.some((fav) => fav.id === id);
    const newFavorites = isFav ? favorites.filter((fav) => fav.id !== id) : favorites;

    // Optimistic update
    setFavorites(newFavorites);

    try {
      if (isFav) {
        await api.delete(`/filter-favorites/${id}`);
      } else {
        await api.post(`/filter-favorites/${id}`);
      }
      await fetchFavorites();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      await fetchFavorites();
    }
  };

  const isFavorite = (id: string) => favorites.some((fav) => fav.id === id);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}
