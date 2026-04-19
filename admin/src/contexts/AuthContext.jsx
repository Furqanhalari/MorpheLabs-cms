import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => sessionStorage.removeItem('accessToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    sessionStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const hasPermission = useCallback((resource, action) => {
    if (!user) return false;
    const PERMS = {
      SUPER_ADMIN:     { users:['create','read','update','delete'], posts:['create','read','update','delete','publish'], services:['create','read','update','delete','publish'], careers:['create','read','update','delete','publish'], applications:['read','update','delete'], media:['create','read','delete'], settings:['read','update'], audit:['read'] },
      CONTENT_MANAGER: { posts:['create','read','update','delete','publish'], services:['create','read','update','delete','publish'], careers:['create','read','update','delete','publish'], applications:['read','update'], media:['create','read','delete'] },
      BLOG_EDITOR:     { posts:['create','read','update','publish'], media:['create','read'] },
      BLOG_AUTHOR:     { posts:['create','read','update'], media:['create','read'] },
      HR_MANAGER:      { careers:['create','read','update','delete','publish'], applications:['read','update','delete'], media:['create','read'] },
      VIEWER:          { posts:['read'], services:['read'], careers:['read'], applications:['read'], media:['read'] },
    };
    return PERMS[user.role]?.[resource]?.includes(action) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
