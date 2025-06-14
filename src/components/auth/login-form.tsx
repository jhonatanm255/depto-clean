
"use client";
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, type FormEvent } from 'react';
import { Building, UserCog, Users } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Password check is illustrative
  const [role, setRole] = useState<UserRole>('employee');
  const { login, loading } = useAuth();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Simplified login, password isn't actually checked against a hash here
    if (role === 'admin' && email === 'admin@cleansweep.com' && password === 'admin123') {
        login(email, role);
    } else if (role === 'employee' && email === 'employee@cleansweep.com' && password === 'emp123') {
        login(email, role);
    } else {
        alert('Invalid credentials. Please use admin@cleansweep.com (admin123) or employee@cleansweep.com (emp123).');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building size={32} />
        </div>
        <CardTitle className="font-headline text-3xl">Welcome Back!</CardTitle>
        <CardDescription>Log in to manage your cleaning tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email Address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
          </div>
          <div className="space-y-3">
            <Label>Log in as</Label>
            <RadioGroup
              defaultValue="employee"
              onValueChange={(value: string) => setRole(value as UserRole)}
              className="flex gap-4"
              aria-label="Select your role"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label htmlFor="role-admin" className="flex items-center gap-2 cursor-pointer">
                  <UserCog className="h-5 w-5 text-muted-foreground" /> Admin
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="role-employee" />
                <Label htmlFor="role-employee" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-5 w-5 text-muted-foreground" /> Employee
                </Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Log In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        <p>Use admin@cleansweep.com (pw: admin123) or employee@cleansweep.com (pw: emp123).</p>
      </CardFooter>
    </Card>
  );
}
