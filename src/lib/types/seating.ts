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

export type ClientTable = {
  id: string;
  name: string;
  capacity: number;
  shape: TableShape;
  notes: string | null;
  sortOrder: number;
  guestIds: string[];
};
