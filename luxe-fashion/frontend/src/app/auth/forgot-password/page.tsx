'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="font-serif text-2xl tracking-widest uppercase text-brand-900 dark:text-white block text-center mb-10">Luxe</Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✉️</span>
            </div>
            <h1 className="font-serif text-2xl font-light text-brand-900 dark:text-white mb-3">Check your email</h1>
            <p className="text-brand-500 text-sm mb-8">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <Link href="/auth/login" className="btn-primary text-xs inline-block">Back to Sign In</Link>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl font-light text-brand-900 dark:text-white mb-2 text-center">Forgot Password</h1>
            <p className="text-brand-500 text-sm text-center mb-8">Enter your email and we'll send a reset link</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-small block mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="your@email.com" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-brand-500">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-brand-900 dark:text-white underline hover:no-underline">Sign in</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
