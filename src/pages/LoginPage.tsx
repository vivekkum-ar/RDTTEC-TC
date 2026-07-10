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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1d8bcb]/20 via-[#f5821f]/15 via-background to-[#1d8bcb]/15 animate-gradient p-4" style={{ backgroundSize: '200% 200%' }}>
      <Card className="w-full max-w-md shadow-xl border-0 ring-1 ring-border/50 animate-scale-in">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <img src="/NTTFLOGO.png" alt="NTTF Logo" className="h-20 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">TC Generator</CardTitle>
          <CardDescription>Sign in to access the Transfer Certificate system</CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@nttf.ac.in"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full gap-2 bg-[#1d8bcb] hover:bg-[#1d8bcb]/90 text-white">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
