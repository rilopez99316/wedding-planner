import type { TableShape } from "@prisma/client";

export type ClientGuest = {
  id: string;
  firstName: string;
  lastName: string;
  groupId: string;
  groupName: string;
  isPlusOne: boolean;
  dietaryRestrictions: { restriction: string; notes: string | null }[];
};

export type SeatPosition = {
  seatNumber: number;  // 1-based
  guestId: string;
};

export type ClientTable = {
  id: string;
  name: string;
  capacity: number;
  shape: TableShape;
  notes: string | null;
  sortOrder: number;
  guestIds: string[];
  /** Ordered list of seat positions (1-based). Guests assigned via DnD
   *  (no explicit seat) fill in remaining spots sequentially. */
  seatPositions: SeatPosition[];
};
