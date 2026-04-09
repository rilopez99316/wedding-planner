export type EventKey = "ceremony" | "reception" | "rehearsal-dinner" | "farewell-brunch";

export type DietaryKey =
  | "nut"
  | "shellfish"
  | "gluten"
  | "dairy"
  | "vegan"
  | "vegetarian"
  | "kosher"
  | "halal";

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  isPlusOne: boolean;
}

export interface GuestGroup {
  id: string;
  groupName: string;
  guests: Guest[];
  allowedEvents: EventKey[];
  hasPlusOne: boolean;
  plusOneNameIfKnown?: string;
}

export interface DietarySelection {
  guestId: string;
  restrictions: DietaryKey[];
  otherNotes: string;
}

export interface EventAttendance {
  eventKey: EventKey;
  attending: boolean;
}

export interface RSVPResponse {
  groupId: string;
  submittedAt: Date;
  plusOneAttending: boolean;
  plusOneName?: string;
  eventAttendance: EventAttendance[];
  dietary: DietarySelection[];
}
