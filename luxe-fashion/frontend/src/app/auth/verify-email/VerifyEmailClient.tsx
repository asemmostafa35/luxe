'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

export default function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-brand-300 border-t-brand-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-brand-600 dark:text-brand-400">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="font-serif text-2xl font-light text-brand-900 dark:text-white mb-3">Email Verified!</h1>
            <p className="text-brand-500 text-sm mb-8">Your email has been verified. You can now enjoy full access to your account.</p>
            <Link href="/profile" className="btn-primary text-xs inline-block">Go to My Account</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={28} className="text-red-500" />
            </div>
            <h1 className="font-serif text-2xl font-light text-brand-900 dark:text-white mb-3">Verification Failed</h1>
            <p className="text-brand-500 text-sm mb-8">The link is invalid or has expired. Please sign in and request a new verification email.</p>
            <Link href="/auth/login" className="btn-primary text-xs inline-block">Back to Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
