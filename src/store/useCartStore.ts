import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  brandId: "coffee" | "papa" | "mama";
  image?: string;
}

export interface PlacedOrder {
  id: string;
  items: CartItem[];
  tableNumber: string;
  specialNotes?: string;
  totalPrice: number;
  placedAt: string;
  status: "received" | "preparing" | "served";
}

export function formatTableNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Table 04";

  // If already starts with "table" case-insensitively, e.g. "table 4" or "Table 12"
  if (/^table\s*/i.test(trimmed)) {
    const numPart = trimmed.replace(/^table\s*/i, "").trim();
    if (/^\d+$/.test(numPart)) {
      return `Table ${numPart.padStart(2, "0")}`;
    }
    return `Table ${numPart}`;
  }

  // If pure digits e.g. "4" -> "Table 04", "12" -> "Table 12"
  if (/^\d+$/.test(trimmed)) {
    return `Table ${trimmed.padStart(2, "0")}`;
  }

  // Otherwise preserve custom labels e.g. "Patio 3", "VIP 1", "Bar 02"
  return trimmed;
}

interface CartStore {
  items: CartItem[];
  activeOrders: PlacedOrder[];
  tableNumber: string;
  isCartOpen: boolean;
  viewingOrderStatus: boolean;

  setTableNumber: (table: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setViewingOrderStatus: (val: boolean) => void;

  addItem: (item: {
    id: string;
    name: string;
    price: number;
    description?: string;
    image?: string;
    brandId: "coffee" | "papa" | "mama";
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (notes?: string) => PlacedOrder | null;

  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (id: string) => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  activeOrders: [],
  tableNumber: "Table 04",
  isCartOpen: false,
  viewingOrderStatus: false,

  setTableNumber: (table) => set({ tableNumber: table }),
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setViewingOrderStatus: (val) => set({ viewingOrderStatus: val }),

  addItem: (item) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { items: updated };
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }],
      };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  updateQuantity: (id, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.id !== id) };
      }
      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state;

      return {
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        ),
      };
    });
  },

  clearCart: () => set({ items: [] }),

  placeOrder: (notes = "") => {
    const { items, tableNumber, getTotalPrice } = get();
    if (items.length === 0) return null;

    const orderId = `VY-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newOrder: PlacedOrder = {
      id: orderId,
      items: [...items],
      tableNumber,
      specialNotes: notes,
      totalPrice: getTotalPrice(),
      placedAt: timeString,
      status: "received",
    };

    set((state) => ({
      items: [],
      activeOrders: [newOrder, ...state.activeOrders],
      viewingOrderStatus: true,
    }));

    return newOrder;
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemQuantity: (id: string) => {
    const item = get().items.find((i) => i.id === id);
    return item ? item.quantity : 0;
  },
}));
