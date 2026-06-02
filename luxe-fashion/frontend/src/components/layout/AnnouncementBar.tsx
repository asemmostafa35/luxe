"use client";

/**
 * ✅ FIX 3b — AnnouncementBar Hydration Error
 *
 * ROOT CAUSE:
 * `useState(true)` renders `visible=true` on the server. But if the user
 * previously dismissed the bar (stored in localStorage), the client sets
 * `visible=false` in the initial render → mismatch.
 *
 * FIX: Start with `visible` as `null` (unknown). The server and initial
 * client render both show nothing. After mount, read localStorage and set
 * the real value. This is consistent and hydration-safe.
 */

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "luxe-announcement-dismissed";

const DEFAULT_MESSAGES = [
  "Free shipping on orders over $100",
  "New arrivals every Friday",
  "30-day hassle-free returns",
];

export default function AnnouncementBar() {
  // ✅ FIX: null = "not yet determined" (server + first client paint = hidden)
  //    true = show, false = dismissed
  const [visible, setVisible] = useState<boolean | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // After mount: check if user has dismissed it
    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setVisible(!dismissed);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % DEFAULT_MESSAGES.length),
      4000,
    );
    return () => clearInterval(t);
  }, [visible]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  // null = server/first-paint: render nothing to avoid hydration mismatch
  if (!visible) return null;

  return (
    <div className="bg-brand-900 dark:bg-brand-800 text-white py-2.5 px-4 relative">
      <p className="text-center text-xs tracking-widest uppercase font-medium transition-all">
        {DEFAULT_MESSAGES[idx]}
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        aria-label="Close announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
