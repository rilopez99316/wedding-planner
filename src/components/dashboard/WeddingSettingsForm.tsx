"use client";

import { useState } from "react";
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
    slug: string;
  };
}

export default function WeddingSettingsForm({ wedding }: WeddingSettingsFormProps) {
  const [form, setForm] = useState(wedding);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
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
