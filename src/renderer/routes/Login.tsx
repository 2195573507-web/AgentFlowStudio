import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import Button from '../components/Button';
import SurfaceCard from '../components/SurfaceCard';
import Input from '../components/Input';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('123@admin.com');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');
    if (!email.trim() || !password) {
      setLocalError('Email and password are required.');
      return;
    }
    const ok = await login({ email, password });
    if (ok) {
      const from = (location.state as { from?: string } | null)?.from || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-auto bg-transparent p-6 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-panel bg-accent-500/15 text-accent-600 dark:text-accent-300">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-slate-100">LocalAI Nexus</h1>
          <p className="text-sm text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            鐧诲綍鏈湴浼樺厛鐨?Agent 宸ヤ綔娴佸伐浣滃彴銆傞粯璁ょ鐞嗗憳閭宸蹭负浣犲～濂姐€?          </p>
        </div>

        <SurfaceCard>
          <form className="space-y-4" onSubmit={submit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<Mail className="h-4 w-4" />}
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
            />
            {(localError || error) && (
              <div className="rounded-panel border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {localError || error}
              </div>
            )}
            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </form>
        </SurfaceCard>

        <SurfaceCard padding="md" className="border-amber-400/25 bg-amber-500/10">
          <div className="flex gap-3 text-sm text-amber-800 dark:text-amber-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              榛樿绠＄悊鍛橈細<strong>123@admin.com</strong>锛屽垵濮嬪瘑鐮侊細<strong>123456</strong>銆?              棣栨鐧诲綍鍚庝細瑕佹眰淇敼瀵嗙爜锛涘鏋滅湅鍒版敼瀵嗛〉锛屽綋鍓嶅瘑鐮佷粛濉啓 123456锛屾柊瀵嗙爜鑷冲皯 6 浣嶃€?            </p>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
