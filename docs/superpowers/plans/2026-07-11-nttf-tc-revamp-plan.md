# NTTF TC Generator Revamp — Implementation Plan

> **For agentic workers:** Use inline execution.

**Goal:** Redesign the TC Generator with NTTF branding, auth, dark mode, collapsible sidebar, preview modal, auto-save to sheets, and settings password lock.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + ShadCN UI

## Global Constraints
- Colors: primary `#f5821f`, secondary `#1d8bcb`
- Admin credentials in `.env`: VITE_ADMIN_EMAIL, VITE_ADMIN_PASSWORD
- Settings password: `vivek123`
- Dark mode persisted in `localStorage('darkMode')`
- Sidebar: collapsible `w-16`/`w-64`, hidden by default showing only icons

---

### Task 1: Auth System (AuthContext + LoginPage + AuthGuard)

**Files:**
- Create: `src/lib/AuthContext.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/components/AuthGuard.tsx`
- Create: `.env`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: React Router, React Context
- Produces: `AuthProvider`, `useAuth()`, `LoginPage`, `AuthGuard`

- [ ] **Step 1: Create `.env` file**

```
VITE_ADMIN_EMAIL=admin@nttf.ac.in
VITE_ADMIN_PASSWORD=vivek123
```

- [ ] **Step 2: Create `src/lib/AuthContext.tsx`**

AuthContext with: `user: { email: string } | null`, `login(email, password): boolean`, `logout()`, `isAuthenticated: boolean`. Persist auth to localStorage('authUser').

```tsx
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
```

- [ ] **Step 3: Create `src/pages/LoginPage.tsx`**

Full-screen login with gradient background, NTTF logo, email + password fields. Centered card with ShadCN components.

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { AlertCircle, LogIn } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(email, password)) {
      navigate('/', { replace: true });
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5821f]/10 via-background to-[#1d8bcb]/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src="/NTTFLOGO.png" alt="NTTF Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">TC Generator</CardTitle>
          <CardDescription>Sign in to access the Transfer Certificate system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@nttf.ac.in" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full gap-2 bg-[#f5821f] hover:bg-[#f5821f]/90">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/AuthGuard.tsx`**

Redirects to /login if not authenticated.

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import type { ReactNode } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 5: Update `src/main.tsx` to wrap with AuthProvider**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
```

- [ ] **Step 6: Update `src/App.tsx` to add Login route and AuthGuard**

Add LoginPage to imports, add `/login` route, wrap main routes with AuthGuard.

---

### Task 2: Theme, Dark Mode & CSS Variables

**Files:**
- Modify: `src/index.css` — complete rewrite with NTTF theme, gradients, dark mode

**CSS Variables for NTTF theme:**
```css
:root {
  --background: oklch(0.98 0.01 85); /* warm white */
  --primary: #f5821f;
  --primary-foreground: white;
  --secondary: #1d8bcb;
  --secondary-foreground: white;
}
.dark { /* inverted tones */ }
```

Add gradient classes, dark mode toggle logic.

---

### Task 3: Collapsible Sidebar + Footer

**Files:**
- Modify: `src/App.tsx` — sidebar redesign

Sidebar:
- Default state: `w-16`, only icons visible
- On hover: `w-64`, icons + labels
- NTTF logo in header
- Footer: "Made by Vivek Kumar" with GitHub link

---

### Task 4: Settings Password Lock

**Files:**
- Modify: `src/pages/SettingsPage.tsx` (create if separate) or modify `src/App.tsx`

Password gate on settings page. Prompt for "vivek123". Session-only persistence.

---

### Task 5: TC Preview Modal with Letterhead

**Files:**
- Modify: `src/components/TCPreview.tsx` — A4 modal with letterhead background, remove school info

---

### Task 6: Auto-Save to Sheets on PDF Generation

**Files:**
- Modify: `src/components/TCForm.tsx` — generate PDF auto-saves to sheets
- Modify: `src/components/BulkUpload.tsx` — bulk PDF auto-saves

---

### Task 7: Final Polish — Colors, Spacing, Footer

**Files:**
- Modify: `src/App.tsx` — gradient header, footer
- Modify: `src/components/TCPreview.tsx` — increased line spacing

