export const weddingConfig = {
  couple: {
    partner1: "Israel",
    partner2: "Savannah",
    displayNames: "Israel & Savannah",
  },
  date: {
    wedding: new Date("2025-09-20T16:00:00"),
    rsvpDeadline: new Date("2025-08-01T23:59:59"),
  },
  venue: {
    name: "Villa de la Paz",
    address: "1420 Vineyard Lane, Napa Valley, CA 94558",
    shortAddress: "Napa Valley, CA",
  },
  events: {
    ceremony: { label: "Ceremony", date: new Date("2025-09-20T16:00:00") },
    reception: { label: "Reception", date: new Date("2025-09-20T18:00:00") },
    "rehearsal-dinner": { label: "Rehearsal Dinner", date: new Date("2025-09-19T19:00:00") },
    "farewell-brunch": { label: "Farewell Brunch", date: new Date("2025-09-21T10:00:00") },
  },
  colors: {
    navy: "#1B2A4A",
    champagne: "#F5E6C8",
    ivory: "#FDFAF5",
    gold: "#C9A84C",
  },
} as const;
