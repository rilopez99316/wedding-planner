import { GuestGroup } from "./types";

export const guestGroups: GuestGroup[] = [
  {
    id: "harrison-family",
    groupName: "The Harrison Family",
    guests: [
      { id: "hf-1", firstName: "Margaret", lastName: "Harrison", isPlusOne: false },
      { id: "hf-2", firstName: "Thomas", lastName: "Harrison", isPlusOne: false },
      { id: "hf-3", firstName: "Claire", lastName: "Harrison", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception", "rehearsal-dinner", "farewell-brunch"],
    hasPlusOne: false,
  },
  {
    id: "chen-family",
    groupName: "The Chen Family",
    guests: [
      { id: "cf-1", firstName: "David", lastName: "Chen", isPlusOne: false },
      { id: "cf-2", firstName: "Lily", lastName: "Chen", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception", "farewell-brunch"],
    hasPlusOne: true,
    plusOneNameIfKnown: "James Chen",
  },
  {
    id: "olivia-porter",
    groupName: "Olivia Porter",
    guests: [
      { id: "op-1", firstName: "Olivia", lastName: "Porter", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception"],
    hasPlusOne: true,
  },
  {
    id: "wedding-party-santiago",
    groupName: "Marco Santiago",
    guests: [
      { id: "ms-1", firstName: "Marco", lastName: "Santiago", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception", "rehearsal-dinner", "farewell-brunch"],
    hasPlusOne: true,
    plusOneNameIfKnown: "Elena Santiago",
  },
  {
    id: "wedding-party-williams",
    groupName: "Sophia Williams",
    guests: [
      { id: "sw-1", firstName: "Sophia", lastName: "Williams", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception", "rehearsal-dinner"],
    hasPlusOne: false,
  },
  {
    id: "bennett-couple",
    groupName: "The Bennetts",
    guests: [
      { id: "bn-1", firstName: "Robert", lastName: "Bennett", isPlusOne: false },
      { id: "bn-2", firstName: "Patricia", lastName: "Bennett", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception"],
    hasPlusOne: false,
  },
  {
    id: "alex-kim",
    groupName: "Alex Kim",
    guests: [
      { id: "ak-1", firstName: "Alex", lastName: "Kim", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception"],
    hasPlusOne: true,
  },
  {
    id: "nguyen-family",
    groupName: "The Nguyen Family",
    guests: [
      { id: "ng-1", firstName: "Hanh", lastName: "Nguyen", isPlusOne: false },
      { id: "ng-2", firstName: "Vincent", lastName: "Nguyen", isPlusOne: false },
      { id: "ng-3", firstName: "Sophie", lastName: "Nguyen", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception", "farewell-brunch"],
    hasPlusOne: false,
  },
  {
    id: "dr-patel",
    groupName: "Dr. Priya Patel",
    guests: [
      { id: "pp-1", firstName: "Priya", lastName: "Patel", isPlusOne: false },
    ],
    allowedEvents: ["ceremony", "reception"],
    hasPlusOne: true,
    plusOneNameIfKnown: "Rohan Patel",
  },
];
