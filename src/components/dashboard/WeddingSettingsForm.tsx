"use client";

import { useState, useRef } from "react";
import { updateWeddingDetailsAction } from "@/lib/actions/settings";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface WeddingSettingsFormProps {
  wedding: {
    partner1Name: string;
    partner2Name: string;
    weddingDate: string;
    rsvpDeadline: string;
    venueName: string;
    venueAddress: string;
    accentColor: string;
    coverPhotoUrl: string;
    slug: string;
  };
}

export default function WeddingSettingsForm({ wedding }: WeddingSettingsFormProps) {
  const [form, setForm] = useState(wedding);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      set("coverPhotoUrl", json.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateWeddingDetailsAction(form);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Couple */}
      <section className="bg-white rounded-[16px] shadow-apple-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Couple</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Partner 1 name"
            value={form.partner1Name}
            onChange={(e) => set("partner1Name", e.target.value)}
          />
          <Input
            label="Partner 2 name"
            value={form.partner2Name}
            onChange={(e) => set("partner2Name", e.target.value)}
          />
        </div>
      </section>

      {/* Dates */}
      <section className="bg-white rounded-[16px] shadow-apple-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Dates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="Wedding date"
            value={form.weddingDate}
            onChange={(e) => set("weddingDate", e.target.value)}
          />
          <Input
            type="datetime-local"
            label="RSVP deadline"
            value={form.rsvpDeadline}
            onChange={(e) => set("rsvpDeadline", e.target.value)}
          />
        </div>
      </section>

      {/* Venue */}
      <section className="bg-white rounded-[16px] shadow-apple-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Venue</h2>
        <Input
          label="Venue name"
          placeholder="e.g. The Grand Ballroom"
          value={form.venueName}
          onChange={(e) => set("venueName", e.target.value)}
        />
        <Input
          label="Venue address"
          placeholder="e.g. 123 Main St, City, State"
          value={form.venueAddress}
          onChange={(e) => set("venueAddress", e.target.value)}
        />
      </section>

      {/* Cover photo */}
      <section className="bg-white rounded-[16px] shadow-apple-sm p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Cover Photo</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload a photo or paste a URL. Recommended: wide landscape (16:9), under 10MB.
          </p>
        </div>

        {/* Upload area */}
        <div
          className="relative border-2 border-dashed border-gray-200 rounded-[10px] p-6 text-center hover:border-accent/40 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleUpload}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-5 h-5 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              <p className="text-xs text-gray-500">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-500">Click to upload a photo</p>
              <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF · max 10MB</p>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="text-xs text-red-500">{uploadError}</p>
        )}

        {/* URL fallback */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400">or paste a URL</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <Input
          label="Image URL"
          placeholder="https://images.unsplash.com/..."
          value={form.coverPhotoUrl}
          onChange={(e) => set("coverPhotoUrl", e.target.value)}
        />

        {/* Preview */}
        {form.coverPhotoUrl && (
          <div className="relative rounded-[10px] overflow-hidden aspect-video bg-gray-100 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.coverPhotoUrl}
              alt="Cover photo preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <button
              type="button"
              onClick={() => set("coverPhotoUrl", "")}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove photo"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* Accent color */}
      <section className="bg-white rounded-[16px] shadow-apple-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Accent Color</h2>
        <p className="text-xs text-gray-500">
          This color is used on your public wedding website.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={form.accentColor}
            onChange={(e) => set("accentColor", e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
          />
          <Input
            label="Hex value"
            value={form.accentColor}
            onChange={(e) => set("accentColor", e.target.value)}
            className="flex-1"
          />
        </div>
      </section>

      {/* Website link */}
      <section className="bg-white rounded-[16px] shadow-apple-sm p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Your Wedding Website</h2>
        <p className="text-xs text-gray-500">
          Share this link with your guests.
        </p>
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-[10px]">
          <span className="text-sm text-gray-500 font-sans flex-1 truncate">
            {process.env.NEXT_PUBLIC_APP_URL ?? ""}/{wedding.slug}
          </span>
          <Link
            href={`/${wedding.slug}`}
            target="_blank"
            className="text-xs text-accent hover:underline font-sans flex-shrink-0"
          >
            Visit →
          </Link>
        </div>
      </section>

      {/* Events link */}
      <section className="bg-white rounded-[16px] shadow-apple-sm p-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Events</h2>
          <p className="text-xs text-gray-500 mt-0.5">Add or edit your ceremony, reception, and other events.</p>
        </div>
        <Link
          href="/dashboard/settings/events"
          className="text-sm text-accent hover:underline font-sans"
        >
          Manage events →
        </Link>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} loading={saving}>
          Save changes
        </Button>
        {saved && (
          <span className="text-sm text-green-600 font-sans">Saved!</span>
        )}
        {error && (
          <span className="text-sm text-red-500 font-sans">{error}</span>
        )}
      </div>
    </div>
  );
}
