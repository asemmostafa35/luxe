"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { storeSettingsApi } from "@/lib/api";

const STORAGE_KEY = "zane-announcement-dismissed";
const LEGACY_STORAGE_KEY = "luxe-announcement-dismissed";

const FALLBACK_MESSAGES = [
  "Free shipping on orders over $100",
  "New arrivals every Friday",
  "30-day hassle-free returns",
];

export default function AnnouncementBar() {
  const [visible, setVisible] = useState<boolean | null>(null);
  const [idx, setIdx] = useState(0);

  const { data } = useQuery({
    queryKey: ["store-settings-public"],
    queryFn: () => storeSettingsApi.getPublic(),
    staleTime: 60_000,
  });

  const settings = data?.data;
  const announcement = settings?.announcement;
  const barEnabled = settings?.announcementEnabled !== false;

  const messages = announcement?.message
    ? [announcement.message]
    : FALLBACK_MESSAGES;

  useEffect(() => {
    const dismissed =
      localStorage.getItem(STORAGE_KEY) === "true" ||
      localStorage.getItem(LEGACY_STORAGE_KEY) === "true";
    if (localStorage.getItem(LEGACY_STORAGE_KEY) === "true") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setVisible(!dismissed);
  }, []);

  useEffect(() => {
    if (!visible || messages.length <= 1) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % messages.length),
      4000,
    );
    return () => clearInterval(t);
  }, [visible, messages.length]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!barEnabled) return null;
  if (!visible) return null;

  return (
    <div className="bg-brand-900 dark:bg-brand-800 text-white py-2.5 px-4 relative">
      <p className="text-center text-xs tracking-widest uppercase font-medium transition-all">
        {messages[idx % messages.length]}
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        aria-label="Close announcement"
        type="button"
      >
        <X size={14} />
      </button>
    </div>
  );
}
