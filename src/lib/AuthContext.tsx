import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  user: { email: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('authUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (email: string, password: string) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@nttf.ac.in';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'vivek123';
    if (email === adminEmail && password === adminPassword) {
      const u = { email };
      setUser(u);
      localStorage.setItem('authUser', JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
