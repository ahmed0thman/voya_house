import { create } from "zustand";
import {
  rememberGuestOrder,
  rememberOrderMode,
  type OrderMode,
} from "@/lib/guest-session";

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  brandId: "coffee" | "papa" | "mama";
  image?: string;
}

export function formatTableNumber(number: number): string {
  return `Table ${String(number).padStart(2, "0")}`;
}

export const ORDER_MODE_LABEL: Record<OrderMode, string> = {
  ON_TABLE: "Dine In",
  TAKEAWAY: "Pickup",
  DELIVERY: "Delivery",
};

/** Safe to call before the guest has chosen — an unresolved mode is just "Order". */
export function orderModeLabel(mode: OrderMode | null): string {
  return mode ? ORDER_MODE_LABEL[mode] : "Order";
}

interface CartStore {
  items: CartItem[];
  /**
   * How this guest is ordering. `?table=N` (a scanned QR) resolves it to dine in;
   * anyone else arrives with it `null` and picks dine in, pickup or delivery at
   * checkout — there is deliberately no default, since guessing wrong sends
   * someone's food to the wrong place.
   */
  orderMode: OrderMode | null;
  /**
   * Null until a table is known, which is the normal state for anyone who
   * didn't scan a QR. Never defaulted to a real number: a plausible-looking
   * guess would quietly send food to a table the guest isn't sitting at.
   */
  tableNumber: number | null;
  /**
   * Whether `tableNumber` came from a scanned QR rather than the guest picking
   * from a list. A scan is proof of where they physically are, so it's shown as
   * settled fact; a self-declared table stays editable.
   */
  tableFromScan: boolean;
  /** Ids of the takeaway/delivery tickets this browser has placed — how those guests track their orders. */
  guestOrderIds: string[];
  isCartOpen: boolean;
  viewingOrderStatus: boolean;

  setTableNumber: (table: number | null, options?: { fromScan?: boolean }) => void;
  /** `persist: false` while hydrating from storage, so a restore doesn't rewrite what it just read. */
  setOrderMode: (mode: OrderMode, options?: { persist?: boolean }) => void;
  setGuestOrderIds: (ids: string[]) => void;
  /** Returns the resulting id list — callers key their status query off it. */
  trackGuestOrder: (id: string) => string[];
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setViewingOrderStatus: (val: boolean) => void;

  addItem: (
    item: {
      id: string;
      name: string;
      price: number;
      description?: string;
      image?: string;
      brandId: "coffee" | "papa" | "mama";
    },
    quantity?: number,
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (id: string) => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  orderMode: null,
  tableNumber: null,
  tableFromScan: false,
  guestOrderIds: [],
  isCartOpen: false,
  viewingOrderStatus: false,

  setTableNumber: (table, options) =>
    set({ tableNumber: table, tableFromScan: options?.fromScan ?? false }),

  setOrderMode: (mode, options) => {
    set({ orderMode: mode });
    // Dine-in is never written down — the scan is the state, so a settled visit
    // can't linger and reclaim a later param-less visit. Only the guest's own
    // pickup/delivery choice is worth remembering.
    if (options?.persist !== false && mode !== "ON_TABLE") {
      rememberOrderMode(mode);
    }
  },

  setGuestOrderIds: (ids) => set({ guestOrderIds: ids }),
  trackGuestOrder: (id) => {
    const guestOrderIds = rememberGuestOrder(id);
    set({ guestOrderIds });
    return guestOrderIds;
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setViewingOrderStatus: (val) => set({ viewingOrderStatus: val }),

  addItem: (item, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return { items: updated };
      }
      return {
        items: [...state.items, { ...item, quantity }],
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
