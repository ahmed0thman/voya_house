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
    brand: (brandSlug: string) => ["publicMenu", brandSlug] as const,
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
  users: {
    all: ["users"] as const,
  },
  tables: {
    all: ["tables"] as const,
  },
  offers: {
    all: ["offers"] as const,
  },
  auth: {
    currentUser: ["auth", "currentUser"] as const,
  },
};
