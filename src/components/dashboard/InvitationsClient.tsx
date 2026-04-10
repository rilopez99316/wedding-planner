"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendInvitationsAction, sendRemindersAction } from "@/lib/actions/invitations";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { GuestGroup, Guest, RsvpResponse } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type GroupWithGuests = GuestGroup & {
  guests: Guest[];
  rsvpResponse: RsvpResponse | null;
};

interface InvitationsClientProps {
  groups: GroupWithGuests[];
}

export default function InvitationsClient({ groups }: InvitationsClientProps) {
  const router = useRouter();
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null);

  const notInvitedGroups = groups.filter((g) => !g.guests.some((gu) => gu.invitationSentAt));
  const pendingGroups = groups.filter(
    (g) => g.guests.some((gu) => gu.invitationSentAt) && !g.rsvpResponse
  );

  async function handleSendAll() {
    const guestIds = notInvitedGroups.flatMap((g) =>
      g.guests.filter((gu) => (gu.email || gu.phone) && !gu.invitationSentAt).map((gu) => gu.id)
    );

    if (guestIds.length === 0) {
      alert("No guests with email or phone to invite.");
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

  function getGroupStatus(group: GroupWithGuests) {
    const hasSent = group.guests.some((g) => g.invitationSentAt);
    if (group.rsvpResponse) return "responded";
    if (hasSent) return "pending";
    return "not-invited";
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Result message */}
      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${result.errors.length === 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
          {result.sent > 0 && <p>✓ {result.sent} invitation{result.sent !== 1 ? "s" : ""} sent successfully.</p>}
          {result.errors.map((e, i) => <p key={i}>✗ {e}</p>)}
          <button onClick={() => setResult(null)} className="mt-1 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="md"
          loading={sendingAll}
          onClick={handleSendAll}
          disabled={notInvitedGroups.length === 0}
        >
          Send all invitations
          {notInvitedGroups.length > 0 && (
            <span className="ml-1 bg-white/20 rounded px-1.5 py-0.5 text-xs">{notInvitedGroups.length}</span>
          )}
        </Button>
        <Button
          variant="secondary"
          size="md"
          loading={sendingReminders}
          onClick={handleSendReminders}
          disabled={pendingGroups.length === 0}
        >
          Send reminders
          {pendingGroups.length > 0 && (
            <span className="ml-1 bg-gray-300/50 rounded px-1.5 py-0.5 text-xs">{pendingGroups.length}</span>
          )}
        </Button>
      </div>

      {/* Groups table */}
      <div className="bg-white rounded-lg shadow-apple-sm border border-gray-100 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Group</span>
          <span>Status</span>
          <span>Sent</span>
          <span></span>
        </div>

        <div className="divide-y divide-gray-100">
          {groups.map((group) => {
            const status = getGroupStatus(group);
            const primaryGuest = group.guests[0];
            const sentAt = group.guests.find((g) => g.invitationSentAt)?.invitationSentAt;
            const hasContact = group.guests.some((g) => g.email || g.phone);

            return (
              <div key={group.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3.5 items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">{group.groupName}</div>
                  {primaryGuest?.email && (
                    <div className="text-xs text-gray-400">{primaryGuest.email}</div>
                  )}
                  {!primaryGuest?.email && primaryGuest?.phone && (
                    <div className="text-xs text-gray-400">{primaryGuest.phone}</div>
                  )}
                  {!hasContact && (
                    <div className="text-xs text-amber-600">No email or phone — add contact info to send invitation</div>
                  )}
                </div>

                <div>
                  {status === "responded" && <Badge variant="success">Responded</Badge>}
                  {status === "pending" && <Badge variant="warning">Awaiting</Badge>}
                  {status === "not-invited" && <Badge variant="default">Not sent</Badge>}
                </div>

                <div className="text-xs text-gray-400">
                  {sentAt ? formatDate(sentAt) : "—"}
                </div>

                <div>
                  {status === "not-invited" && hasContact && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const guestId = group.guests.find((g) => g.email || g.phone)?.id;
                        if (!guestId) return;
                        await sendInvitationsAction([guestId]);
                        router.refresh();
                      }}
                      className="text-xs"
                    >
                      Send
                    </Button>
                  )}
                  {status === "pending" && hasContact && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const guestId = group.guests.find((g) => g.email || g.phone)?.id;
                        if (!guestId) return;
                        await sendInvitationsAction([guestId]);
                        router.refresh();
                      }}
                      className="text-xs"
                    >
                      Resend
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
