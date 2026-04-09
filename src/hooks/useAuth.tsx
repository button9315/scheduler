import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  role: string;
  department?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<string>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await api.get('/auth/me');
          setUser(data.id ? data : data.user);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post('/auth/signin', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (signupData: any) => {
    try {
      const data = await api.post('/auth/signup', signupData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.token;
    } catch (error) {
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
