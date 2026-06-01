'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-brand-900 dark:text-white font-serif text-2xl mb-3">Invalid Link</p>
        <p className="text-brand-500 text-sm mb-6">This reset link is invalid or has expired.</p>
        <Link href="/auth/forgot-password" className="btn-primary text-xs">Request New Link</Link>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success('Password updated! Please sign in.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reset password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="font-serif text-2xl tracking-widest uppercase text-brand-900 dark:text-white block text-center mb-10">Luxe</Link>
        <h1 className="font-serif text-3xl font-light text-brand-900 dark:text-white mb-2 text-center">Set New Password</h1>
        <p className="text-brand-500 text-sm text-center mb-8">Choose a strong password for your account</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-small block mb-2">New Password</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="input-field pr-10" placeholder="Min 6 characters" required />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-0 top-3 text-brand-400 hover:text-brand-700 dark:hover:text-white transition-colors">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label-small block mb-2">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="input-field" placeholder="Repeat password" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
