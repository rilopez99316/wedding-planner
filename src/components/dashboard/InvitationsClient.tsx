"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { sendInvitationsAction, sendRemindersAction } from "@/lib/actions/invitations";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import FadeIn from "@/components/ui/FadeIn";
import { cn, formatDate } from "@/lib/utils";
import type { GuestGroup, Guest, RsvpResponse } from "@prisma/client";

type GroupWithGuests = GuestGroup & {
  guests: Guest[];
  rsvpResponse: RsvpResponse | null;
};

interface InvitationsClientProps {
  groups: GroupWithGuests[];
}

// ── Animated count tile ───────────────────────────────────────────────────────

function CampaignStatTile({
  label,
  count,
  color,
  delay,
}: {
  label: string;
  count: number;
  color: "gray" | "amber" | "green";
  delay: number;
}) {
  const count$ = useMotionValue(0);
  const rounded = useTransform(count$, Math.round);

  useEffect(() => {
    const controls = animate(count$, count, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }, [count, count$]);

  const colorMap = {
    gray: "bg-white border-gray-100",
    amber: "bg-amber-50 border-amber-100",
    green: "bg-green-50 border-green-100",
  };
  const numberColor = {
    gray: "text-gray-900",
    amber: "text-amber-800",
    green: "text-green-800",
  };

  return (
    <FadeIn direction="up" delay={delay}>
      <div className={cn("rounded-xl border shadow-apple-sm px-4 py-4", colorMap[color])}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
        <motion.p className={cn("text-3xl font-semibold", numberColor[color])}>
          {rounded}
        </motion.p>
      </div>
    </FadeIn>
  );
}

// ── Send icon ─────────────────────────────────────────────────────────────────

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function InvitationsClient({ groups }: InvitationsClientProps) {
  const router = useRouter();
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingGroupId, setSendingGroupId] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null);

  const notInvitedGroups = groups.filter((g) => !g.guests.some((gu) => gu.invitationSentAt));
  const pendingGroups = groups.filter(
    (g) => g.guests.some((gu) => gu.invitationSentAt) && !g.rsvpResponse
  );
  const respondedGroups = groups.filter((g) => g.rsvpResponse);

  // Auto-dismiss result after 5 seconds
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 5000);
    return () => clearTimeout(t);
  }, [result]);

  async function handleSendAll() {
    const guestIds = notInvitedGroups.flatMap((g) =>
      g.guests.filter((gu) => (gu.email || gu.phone) && !gu.invitationSentAt).map((gu) => gu.id)
    );
    if (guestIds.length === 0) {
      setResult({ sent: 0, errors: ["No guests with email or phone to invite."] });
      return;
    }
    setSendingAll(true);
    const res = await sendInvitationsAction(guestIds);
    setResult(res);
    setSendingAll(false);
    router.refresh();
  }

  async function handleSendReminders() {
    setSendingReminders(true);
    const res = await sendRemindersAction();
    setResult(res);
    setSendingReminders(false);
    router.refresh();
  }

  async function handleSendGroup(groupId: string, guestId: string) {
    setSendingGroupId(groupId);
    const res = await sendInvitationsAction([guestId]);
    setResult(res);
    setSendingGroupId(null);
    router.refresh();
  }

  function getGroupStatus(group: GroupWithGuests) {
    const hasSent = group.guests.some((g) => g.invitationSentAt);
    if (group.rsvpResponse) return "responded";
    if (hasSent) return "pending";
    return "not-invited";
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Campaign stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CampaignStatTile label="Not Invited" count={notInvitedGroups.length} color="gray" delay={0} />
        <CampaignStatTile label="Awaiting Response" count={pendingGroups.length} color="amber" delay={0.05} />
        <CampaignStatTile label="Responded" count={respondedGroups.length} color="green" delay={0.1} />
      </div>

      {/* Result notification */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "flex items-start gap-3 rounded-xl px-4 py-3.5 border shadow-apple-sm",
              result.errors.length === 0
                ? "bg-green-50 border-green-100"
                : "bg-amber-50 border-amber-100"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              result.errors.length === 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            )}>
              {result.errors.length === 0 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {result.sent > 0 && (
                <p className="text-sm font-semibold text-gray-900">
                  {result.sent} invitation{result.sent !== 1 ? "s" : ""} sent successfully
                </p>
              )}
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-amber-700 mt-0.5">{e}</p>
              ))}
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-apple-sm">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-gray-900">Send Invitations</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {notInvitedGroups.length > 0
              ? `${notInvitedGroups.length} group${notInvitedGroups.length !== 1 ? "s" : ""} haven't received an invitation yet`
              : "All groups have been invited"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            loading={sendingAll}
            onClick={handleSendAll}
            disabled={notInvitedGroups.length === 0}
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            Send All
            {notInvitedGroups.length > 0 && (
              <span className="ml-1.5 bg-white/25 rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold">
                {notInvitedGroups.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={sendingReminders}
            onClick={handleSendReminders}
            disabled={pendingGroups.length === 0}
            className={cn(pendingGroups.length > 0 && "border-amber-300 text-amber-700 hover:bg-amber-50")}
          >
            Remind
            {pendingGroups.length > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold">
                {pendingGroups.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Groups table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-apple-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {groups.map((group, index) => {
            const status = getGroupStatus(group);
            const primaryGuest = group.guests[0];
            const sentAt = group.guests.find((g) => g.invitationSentAt)?.invitationSentAt;
            const hasContact = group.guests.some((g) => g.email || g.phone);
            const actionGuestId = group.guests.find((g) => g.email || g.phone)?.id;
            const isSendingThis = sendingGroupId === group.id;

            const statusBarColor = {
              "responded": "bg-green-500",
              "pending": "bg-amber-400",
              "not-invited": "bg-gray-200",
            }[status];

            return (
              <FadeIn key={group.id} direction="up" delay={index * 0.025}>
                <div className="relative flex items-center hover:bg-gray-50/60 transition-colors">
                  {/* Left status bar */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-none", statusBarColor)} />

                  {/* Content */}
                  <div className="flex flex-1 items-center gap-4 pl-5 pr-4 py-3.5">
                    {/* Group info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-gray-900">{group.groupName}</p>
                      {primaryGuest?.email && (
                        <p className="text-xs text-gray-400 mt-0.5">{primaryGuest.email}</p>
                      )}
                      {!primaryGuest?.email && primaryGuest?.phone && (
                        <p className="text-xs text-gray-400 mt-0.5">{primaryGuest.phone}</p>
                      )}
                      {!hasContact && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5 mt-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          No contact info
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {status === "responded" && <Badge variant="success">Responded</Badge>}
                      {status === "pending" && <Badge variant="warning">Awaiting</Badge>}
                      {status === "not-invited" && <Badge variant="default">Not sent</Badge>}
                    </div>

                    {/* Sent date */}
                    <div className="text-xs text-gray-400 w-24 shrink-0 text-right hidden sm:block">
                      {sentAt ? formatDate(sentAt) : "—"}
                    </div>

                    {/* Row action */}
                    <div className="w-16 shrink-0 flex justify-end">
                      {isSendingThis ? (
                        <Spinner size="sm" />
                      ) : status === "not-invited" && hasContact && actionGuestId ? (
                        <button
                          onClick={() => handleSendGroup(group.id, actionGuestId)}
                          className="inline-flex items-center gap-1 text-[12px] font-medium bg-accent text-white rounded-lg px-2.5 py-1.5 hover:brightness-105 transition-all"
                        >
                          <SendIcon className="w-3 h-3" />
                          Send
                        </button>
                      ) : status === "pending" && hasContact && actionGuestId ? (
                        <button
                          onClick={() => handleSendGroup(group.id, actionGuestId)}
                          className="inline-flex items-center gap-1 text-[12px] font-medium bg-gray-100 text-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-gray-200 transition-all"
                        >
                          Resend
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </div>
  );
}
