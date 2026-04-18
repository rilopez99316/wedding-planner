"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import {
  saveDraftAction,
  sendMessageAction,
  deleteMessageAction,
  resendMessageAction,
  type MessageInput,
} from "@/lib/actions/communications";

// ── Types ─────────────────────────────────────────────────────────────────────

type Channel = "email" | "sms";
type RecipientFilter = "all" | "attending" | "not_responded" | "declined";

interface SerializedMessage {
  id: string;
  weddingId: string;
  subject: string | null;
  body: string;
  channel: string;
  status: string;
  recipientFilter: string;
  recipientCount: number | null;
  scheduledAt: string | null;
  sentAt: string | null;
  totalSent: number;
  totalFailed: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalSent: number;
  guestsReached: number;
}

interface GuestCounts {
  total: number;
  attending: number;
}

interface Props {
  messages: SerializedMessage[];
  stats: Stats;
  guestCounts: GuestCounts;
}

interface FormState {
  channel: Channel;
  recipientFilter: RecipientFilter;
  subject: string;
  body: string;
}

const emptyForm = (): FormState => ({
  channel: "email",
  recipientFilter: "all",
  subject: "",
  body: "",
});

// ── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "save-the-date",
    label: "Save the Date Reminder",
    channel: "email" as Channel,
    subject: "A reminder — Save our date!",
    body: "Dear friends and family,\n\nWe wanted to send a warm reminder that our wedding day is approaching. We would be so honored to celebrate with you.\n\nMore details to follow soon — please keep an eye on your inbox!\n\nWith all our love,",
  },
  {
    id: "rsvp-reminder",
    label: "RSVP Reminder",
    channel: "email" as Channel,
    subject: "Friendly reminder — please RSVP",
    body: "Dear friends and family,\n\nWe hope this message finds you well! We are putting the finishing touches on our plans and wanted to gently remind you that our RSVP deadline is coming up.\n\nPlease let us know if you are able to celebrate with us — it would mean the world.\n\nWith love,",
  },
  {
    id: "wedding-day-details",
    label: "Wedding Day Details",
    channel: "email" as Channel,
    subject: "Everything you need to know for our big day",
    body: "Dear loved ones,\n\nOur wedding day is almost here and we are beyond excited! Here are a few important details to keep in mind:\n\nPlease plan to arrive a few minutes early so we can begin on time. Parking is available nearby. We will have our team on hand to help guide you.\n\nWe cannot wait to see your smiling faces and share this unforgettable moment with you.\n\nWith so much love,",
  },
  {
    id: "thank-you-rsvp",
    label: "Thank You for RSVPing",
    channel: "email" as Channel,
    subject: "We received your RSVP — thank you!",
    body: "Dear friends and family,\n\nThank you so much for sending in your RSVP! We are so grateful to know you will be with us on our special day.\n\nWe are working hard to make it a truly beautiful experience and cannot wait to celebrate together.\n\nAll our love,",
  },
  {
    id: "day-of-update",
    label: "Day-Of Update",
    channel: "sms" as Channel,
    subject: "",
    body: "We're getting married TODAY! We can't wait to celebrate with you. Please arrive 15 min early. See you soon!",
  },
];

const FILTER_OPTIONS: Array<{ value: RecipientFilter; label: string }> = [
  { value: "all", label: "All Guests" },
  { value: "attending", label: "Confirmed Attending" },
  { value: "not_responded", label: "Not Yet Responded" },
  { value: "declined", label: "Declined" },
];

const FILTER_LABELS: Record<RecipientFilter, string> = {
  all: "All Guests",
  attending: "Confirmed Attending",
  not_responded: "Not Yet Responded",
  declined: "Declined",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTimeShort(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; dot: string; pill: string }> = {
    draft: {
      label: "Draft",
      dot: "bg-gray-400",
      pill: "bg-gray-50 text-gray-500 border border-gray-200",
    },
    scheduled: {
      label: "Scheduled",
      dot: "bg-accent",
      pill: "bg-accent-light text-accent border border-accent/20",
    },
    sending: {
      label: "Sending…",
      dot: "bg-amber-500",
      pill: "bg-amber-50 text-amber-600 border border-amber-200",
    },
    sent: {
      label: "Sent",
      dot: "bg-green-500",
      pill: "bg-green-50 text-green-700 border border-green-200",
    },
    failed: {
      label: "Failed",
      dot: "bg-red-500",
      pill: "bg-red-50 text-red-600 border border-red-200",
    },
  };

  const cfg = configs[status] ?? configs.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full",
        cfg.pill
      )}
    >
      <motion.span
        className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)}
        {...(status === "sending"
          ? {
              animate: { opacity: [1, 0.3, 1] },
              transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
            }
          : {})}
      />
      {cfg.label}
    </span>
  );
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        channel === "email" ? "bg-accent-light" : "bg-amber-50"
      )}
    >
      {channel === "email" ? (
        <EnvelopeIcon
          className={cn("w-5 h-5", channel === "email" ? "text-accent" : "text-amber-600")}
        />
      ) : (
        <PhoneIcon className="w-5 h-5 text-amber-600" />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommunicationsClient({
  messages,
  stats,
  guestCounts,
}: Props) {
  const router = useRouter();

  const [composing, setComposing] = useState(false);
  const [composeForm, setComposeForm] = useState<FormState>(emptyForm());
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const field =
    "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent bg-white transition-colors";
  const label = "block text-xs font-medium text-gray-500 mb-1";

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleOpenCompose() {
    setComposing(true);
    setComposeError(null);
  }

  function handleCancelCompose() {
    setComposing(false);
    setComposeForm(emptyForm());
    setComposeError(null);
  }

  function handleApplyTemplate(tpl: (typeof TEMPLATES)[number]) {
    setComposeForm((f) => ({
      ...f,
      channel: tpl.channel,
      subject: tpl.subject,
      body: tpl.body,
    }));
  }

  async function handleSend() {
    const { channel, subject, body, recipientFilter } = composeForm;

    if (!body.trim()) {
      setComposeError("Message body is required.");
      return;
    }
    if (channel === "email" && !subject.trim()) {
      setComposeError("Subject line is required for email messages.");
      return;
    }

    setComposeSending(true);
    setComposeError(null);

    const input: MessageInput = { channel, subject, body, recipientFilter };

    try {
      await sendMessageAction(input);
      setComposing(false);
      setComposeForm(emptyForm());
      setComposeSuccess(true);
      setTimeout(() => setComposeSuccess(false), 4000);
      router.refresh();
    } catch (e) {
      setComposeError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
    } finally {
      setComposeSending(false);
    }
  }

  async function handleSaveDraft() {
    if (!composeForm.body.trim()) {
      setComposeError("Add a message before saving as draft.");
      return;
    }
    setComposeSending(true);
    setComposeError(null);
    try {
      await saveDraftAction({
        channel: composeForm.channel,
        subject: composeForm.subject,
        body: composeForm.body,
        recipientFilter: composeForm.recipientFilter,
      });
      setComposing(false);
      setComposeForm(emptyForm());
      router.refresh();
    } catch (e) {
      setComposeError(
        e instanceof Error ? e.message : "Failed to save draft."
      );
    } finally {
      setComposeSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    setDeletingId(id);
    try {
      await deleteMessageAction(id);
      router.refresh();
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  async function handleResend(id: string) {
    setResendingId(id);
    try {
      await resendMessageAction(id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to resend.");
    } finally {
      setResendingId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-apple-sm px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Messages Sent
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {stats.totalSent || "—"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-apple-sm px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Guests Reached
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {stats.guestsReached || "—"}
          </p>
          {guestCounts.total > 0 && stats.guestsReached > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              of {guestCounts.total} total guests
            </p>
          )}
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {composeSuccess && (
          <motion.div
            key="success-toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700"
          >
            <svg
              className="w-4 h-4 shrink-0 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Message sent successfully! Your guests will receive it shortly.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div />
        <Button
          size="sm"
          variant="primary"
          onClick={handleOpenCompose}
          disabled={composing}
        >
          + Compose Message
        </Button>
      </div>

      {/* Compose panel */}
      <AnimatePresence>
        {composing && (
          <motion.div
            key="compose-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-apple-md overflow-hidden"
          >
            <div className="p-5 space-y-5">

              {/* Panel heading */}
              <p className="text-sm font-semibold text-gray-800">
                New Message
              </p>

              {/* Error */}
              {composeError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                >
                  {composeError}
                </motion.p>
              )}

              {/* Channel toggle */}
              <div className="space-y-1.5">
                <p className={label}>Channel</p>
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                  {(["email", "sms"] as Channel[]).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() =>
                        setComposeForm((f) => ({
                          ...f,
                          channel: ch,
                          subject: ch === "sms" ? "" : f.subject,
                        }))
                      }
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                        composeForm.channel === ch
                          ? "bg-white text-gray-900 shadow-apple-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {ch === "email" ? (
                        <EnvelopeIcon className="w-3.5 h-3.5" />
                      ) : (
                        <PhoneIcon className="w-3.5 h-3.5" />
                      )}
                      {ch === "email" ? "Email" : "SMS"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient filter */}
              <div className="space-y-1.5">
                <p className={label}>Recipients</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setComposeForm((f) => ({
                          ...f,
                          recipientFilter: opt.value,
                        }))
                      }
                      className={cn(
                        "text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
                        composeForm.recipientFilter === opt.value
                          ? "bg-accent text-white border-accent shadow-apple-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">
                  {guestCounts.total > 0 ? (
                    <>
                      {composeForm.recipientFilter === "attending"
                        ? `${guestCounts.attending} confirmed attending`
                        : composeForm.recipientFilter === "all"
                        ? `${guestCounts.total} total guests`
                        : "Filtered by RSVP status"}
                      {composeForm.channel === "email"
                        ? " · email required"
                        : " · phone number required"}
                    </>
                  ) : (
                    "Add guests to see recipient counts"
                  )}
                </p>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <p className={label}>Quick Templates</p>
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap bg-white border-gray-200 text-gray-700 hover:border-accent/40 hover:bg-accent-light hover:text-accent"
                    >
                      {tpl.channel === "sms" ? (
                        <PhoneIcon className="w-3 h-3" />
                      ) : (
                        <EnvelopeIcon className="w-3 h-3" />
                      )}
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject line — email only */}
              <AnimatePresence>
                {composeForm.channel === "email" && (
                  <motion.div
                    key="subject-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <label className={label}>
                      Subject Line{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={composeForm.subject}
                      onChange={(e) =>
                        setComposeForm((f) => ({ ...f, subject: e.target.value }))
                      }
                      placeholder="e.g. Everything you need to know for our big day"
                      className={field}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Body textarea */}
              <div>
                <label className={label}>
                  Message{" "}
                  <span className="text-red-400">*</span>
                  {composeForm.channel === "sms" && (
                    <span
                      className={cn(
                        "ml-2 font-normal",
                        composeForm.body.length > 140
                          ? "text-red-500"
                          : "text-gray-400"
                      )}
                    >
                      {composeForm.body.length} / 160
                    </span>
                  )}
                </label>
                <textarea
                  value={composeForm.body}
                  onChange={(e) =>
                    setComposeForm((f) => ({ ...f, body: e.target.value }))
                  }
                  rows={composeForm.channel === "sms" ? 3 : 7}
                  maxLength={composeForm.channel === "sms" ? 160 : 5000}
                  placeholder={
                    composeForm.channel === "email"
                      ? "Write your message here…\n\nTip: Be warm and personal — your guests will treasure every word."
                      : "Type your SMS message here (160 characters max)…"
                  }
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent bg-white transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <Button
                  variant="primary"
                  size="sm"
                  loading={composeSending}
                  onClick={handleSend}
                >
                  Send Message
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={composeSending}
                >
                  Save Draft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelCompose}
                  disabled={composeSending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {messages.length === 0 && !composing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mb-5">
            <EnvelopeIcon className="w-8 h-8 text-accent" />
          </div>
          <p className="font-serif text-xl text-gray-800 mb-2">
            Your guests are waiting to hear from you
          </p>
          <p className="text-sm text-gray-400 max-w-xs mb-7 leading-relaxed">
            Send a heartfelt message to your loved ones — from save-the-dates
            to day-of details.
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenCompose}>
            Compose Your First Message
          </Button>
        </motion.div>
      )}

      {/* Message history */}
      <AnimatePresence mode="popLayout">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-apple-md overflow-hidden"
          >
            {/* Card body */}
            <div className="p-5 flex gap-4">
              <ChannelIcon channel={msg.channel} />

              <div className="flex-1 min-w-0">
                {/* Subject or body preview */}
                <p className="text-[15px] font-semibold text-gray-900 leading-tight truncate">
                  {msg.subject ??
                    msg.body.slice(0, 65) +
                      (msg.body.length > 65 ? "…" : "")}
                </p>
                {msg.subject && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {msg.body.slice(0, 90)}
                    {msg.body.length > 90 ? "…" : ""}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <StatusBadge status={msg.status} />

                  {/* Recipients pill */}
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">
                    <UsersIcon className="w-3 h-3" />
                    {FILTER_LABELS[msg.recipientFilter as RecipientFilter] ??
                      msg.recipientFilter}
                    {msg.recipientCount != null &&
                      ` · ${msg.recipientCount}`}
                  </span>

                  {/* Date chip */}
                  <span className="text-xs text-gray-400">
                    {msg.status === "scheduled" && msg.scheduledAt
                      ? `Scheduled for ${formatDateTimeShort(msg.scheduledAt)}`
                      : msg.sentAt
                      ? `Sent ${formatDateTimeShort(msg.sentAt)}`
                      : `Saved ${formatDateTimeShort(msg.createdAt)}`}
                  </span>
                </div>
              </div>

              {/* Delivery count — sent messages only */}
              {msg.status === "sent" && (
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                    Delivered
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {msg.totalSent}
                  </p>
                  {msg.totalFailed > 0 && (
                    <p className="text-xs text-red-400">
                      {msg.totalFailed} failed
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer strip */}
            <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 truncate flex-1">
                {msg.channel === "email" ? "Email" : "SMS"} ·{" "}
                {msg.channel === "email" ? "Sent via Resend" : "Sent via Twilio"}
              </p>

              <div className="flex items-center gap-1 shrink-0">
                {/* Resend — failed only */}
                {msg.status === "failed" && (
                  <button
                    onClick={() => handleResend(msg.id)}
                    disabled={resendingId === msg.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent px-2.5 py-1 rounded-lg border border-accent/20 bg-accent-light hover:bg-accent hover:text-white transition-colors disabled:opacity-40"
                  >
                    {resendingId === msg.id ? "Resending…" : "Retry"}
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(msg.id)}
                  disabled={deletingId === msg.id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Delete message"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
