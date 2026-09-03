export const queryKeys = {
  brands: {
    all: ["brands"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (brandId?: string) => ["categories", "list", brandId ?? "all"] as const,
  },
  items: {
    all: ["items"] as const,
    list: (categoryId: string) => ["items", "list", categoryId] as const,
    /** Flat menu-wide list used when staff add a line to an existing ticket. */
    orderable: ["items", "orderable"] as const,
  },
  publicMenu: {
    brand: (brandSlug: string, locale: string) => ["publicMenu", brandSlug, locale] as const,
  },
  orders: {
    /** Control board: every open table session with its tickets. */
    sessions: ["orders", "sessions"] as const,
    /** Control board: standalone takeaway/delivery tickets by type. */
    byType: (type: "TAKEAWAY" | "DELIVERY") => ["orders", "byType", type] as const,
    /** Guest: the tickets in one table's currently open session. */
    table: (tableNumber: number) => ["orders", "table", tableNumber] as const,
    /** Guest: the takeaway/delivery tickets this browser placed, tracked by id. */
    guest: (ids: string[]) => ["orders", "guest", [...ids].sort().join(",")] as const,
  },
  stats: {
    dashboard: ["stats", "dashboard"] as const,
    system: ["stats", "system"] as const,
  },
  reports: {
    /** Serialized range input keeps a distinct cache entry per preset/custom dates. */
    dashboard: (rangeKey: string) => ["reports", "dashboard", rangeKey] as const,
    orders: (filtersKey: string) => ["reports", "orders", filtersKey] as const,
  },
  users: {
    all: ["users"] as const,
  },
  tables: {
    all: ["tables"] as const,
    /** Public: active tables only, for the guest's own table picker. */
    guest: ["tables", "guest"] as const,
  },
  offers: {
    all: ["offers"] as const,
    /** Public: the currently featured offer's banner images, if any. */
    featuredBanner: ["offers", "featuredBanner"] as const,
  },
  auth: {
    currentUser: ["auth", "currentUser"] as const,
  },
  settings: {
    /** Admin: the full editable settings row. */
    all: ["settings"] as const,
    /** Public: just the WhatsApp number, for the guest checkout handoff. */
    whatsappOrderNumber: ["settings", "whatsappOrderNumber"] as const,
  },
  contact: {
    /** Admin: every subject, active or not. */
    subjects: ["contact", "subjects"] as const,
    /** Public: active subjects only, for the landing page's topic chips. */
    activeSubjects: ["contact", "activeSubjects"] as const,
    messages: (filtersKey: string) => ["contact", "messages", filtersKey] as const,
  },
};
