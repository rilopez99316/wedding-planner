import { GuestGroup } from "./types";
import { guestGroups } from "./guestData";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - dist / maxLen;
}

function scoreGroup(query: string, group: GuestGroup): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let best = 0;

  // Score against group name
  best = Math.max(best, similarity(q, group.groupName));

  // Score against each guest's full name, first name, last name
  for (const guest of group.guests) {
    const full = `${guest.firstName} ${guest.lastName}`;
    best = Math.max(
      best,
      similarity(q, full),
      similarity(q, guest.firstName),
      similarity(q, guest.lastName)
    );
  }

  // Also score the plus-one name if known
  if (group.plusOneNameIfKnown) {
    best = Math.max(best, similarity(q, group.plusOneNameIfKnown));
  }

  return best;
}

const THRESHOLD = 0.55;
const MAX_RESULTS = 5;

export function fuzzyMatch(query: string): GuestGroup[] {
  if (!query.trim()) return [];

  return guestGroups
    .map((group) => ({ group, score: scoreGroup(query, group) }))
    .filter(({ score }) => score >= THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ group }) => group);
}
