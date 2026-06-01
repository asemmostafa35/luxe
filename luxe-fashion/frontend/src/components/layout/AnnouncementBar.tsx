'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DEFAULT_MESSAGES = [
  'Free shipping on orders over $100',
  'New arrivals every Friday',
  '30-day hassle-free returns',
];

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % DEFAULT_MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-brand-900 dark:bg-brand-800 text-white py-2.5 px-4 relative">
      <p className="text-center text-xs tracking-widest uppercase font-medium transition-all">
        {DEFAULT_MESSAGES[idx]}
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}
