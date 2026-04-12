"use client";

import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface SeatingStatsBarProps {
  seatedCount:    number;
  totalCount:     number;
  onAutoAssign:   () => void;
  isAutoAssigning: boolean;
  onAddTable:     () => void;
}

export default function SeatingStatsBar({
  seatedCount,
  totalCount,
  onAutoAssign,
  isAutoAssigning,
  onAddTable,
}: SeatingStatsBarProps) {
  const pct = totalCount > 0 ? Math.round((seatedCount / totalCount) * 100) : 0;
  const allSeated = seatedCount === totalCount && totalCount > 0;

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-gray-100 rounded-xl shadow-apple-xs px-5 py-3.5 mb-5">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {seatedCount}{" "}
            <span className="text-gray-400 font-normal">
              / {totalCount} confirmed guests seated
            </span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={
                  allSeated
                    ? "h-full rounded-full bg-green-500 transition-all duration-500"
                    : "h-full rounded-full bg-accent transition-all duration-500"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{pct}%</span>
          </div>
        </div>

        {totalCount === 0 && (
          <p className="text-xs text-gray-400">
            Confirmed guests will appear once RSVPs are submitted.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={onAutoAssign}
          disabled={isAutoAssigning || totalCount === 0}
          className="flex items-center gap-1.5"
        >
          {isAutoAssigning ? <Spinner size="sm" /> : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          )}
          Auto-Assign
        </Button>
        <Button onClick={onAddTable} className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Table
        </Button>
      </div>
    </div>
  );
}
