/**
 * Real contact details, sourced from linktr.ee/voyahouse — not editable from
 * the control board (unlike `AppSettings.whatsappOrderNumber`, this is
 * marketing copy, not an operational setting). Update here if a branch or
 * social handle changes.
 */
export const BRANCHES = [
  {
    id: "elGazira",
    phone: "+201103490030",
    mapUrl:
      "https://www.google.com/maps/search/Al%20Ahly%20Club%20Swimming%20Pool/@30.04471727,31.22232108,17z?hl=en",
  },
  {
    id: "nasrCity",
    phone: "+201103490020",
    mapUrl: "https://www.google.com/maps?q=30.0709977,31.357326&z=17&hl=en",
  },
] as const;

export type BranchId = (typeof BRANCHES)[number]["id"];

export const SOCIAL_LINKS = {
  whatsapp: "https://api.whatsapp.com/send?phone=201103490010",
  instagram: "https://instagram.com/voyahouse",
  tiktok: "https://tiktok.com/@voya.house",
  facebook: "https://www.facebook.com/VoyaHouse",
} as const;
