"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { useAuth } from "@/components/providers/AuthProvider";
import { hasPermission } from "@/lib/rbac/permissions";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = user ? hasPermission(user.role, "settings:write") : false;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi.getSettings(),
  });

  const settings = data?.data?.settings;
  const announcements = data?.data?.announcements ?? [];

  const [storeName, setStoreName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [activeAnnouncementId, setActiveAnnouncementId] = useState("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!settings) return;
    setStoreName(settings.storeName ?? "ZANE");
    setContactEmail(settings.contactEmail ?? "hello@zanefashion.com");
    setAnnouncementEnabled(settings.announcementEnabled ?? true);
    setActiveAnnouncementId(settings.activeAnnouncementId ?? "");
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        storeName,
        contactEmail,
        announcementEnabled,
        activeAnnouncementId: activeAnnouncementId || null,
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["store-settings-public"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: () =>
      adminApi.createAnnouncement({
        message: newMessage,
        type: "info",
        isActive: true,
      }),
    onSuccess: () => {
      toast.success("Announcement created");
      setNewMessage("");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: () => toast.error("Failed to create announcement"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader
        title="Settings"
        subtitle="Store name, contact details, and announcement bar"
      />

      <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-medium text-slate-900 dark:text-white">
          General
        </h2>
        <div>
          <label className="label-small block mb-2">Store name</label>
          <input
            className="input-field"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            disabled={!canWrite}
          />
        </div>
        <div>
          <label className="label-small block mb-2">Contact email</label>
          <input
            className="input-field"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={!canWrite}
            placeholder="hello@zanefashion.com"
          />
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary text-xs"
          >
            {saveMutation.isPending ? "Saving…" : "Save general settings"}
          </button>
        )}
      </section>

      <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-medium text-slate-900 dark:text-white">
          Announcement bar
        </h2>
        <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={announcementEnabled}
            onChange={(e) => setAnnouncementEnabled(e.target.checked)}
            disabled={!canWrite}
            className="rounded border-slate-300"
          />
          Show announcement bar on storefront
        </label>
        <div>
          <label className="label-small block mb-2">Active announcement</label>
          <select
            className="input-field"
            value={activeAnnouncementId}
            onChange={(e) => setActiveAnnouncementId(e.target.value)}
            disabled={!canWrite}
          >
            <option value="">Latest active (auto)</option>
            {announcements.map((a: { id: string; message: string }) => (
              <option key={a.id} value={a.id}>
                {a.message.slice(0, 60)}
                {a.message.length > 60 ? "…" : ""}
              </option>
            ))}
          </select>
        </div>
        {canWrite && (
          <>
            <div>
              <label className="label-small block mb-2">New announcement</label>
              <input
                className="input-field"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Free shipping on orders over $100"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => createAnnouncementMutation.mutate()}
                disabled={
                  !newMessage.trim() || createAnnouncementMutation.isPending
                }
                className="btn-outline text-xs"
              >
                Add announcement
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn-primary text-xs"
              >
                Save bar settings
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
