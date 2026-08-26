import "dotenv/config";
import {
  PrismaClient,
  OrderStatus,
  OrderType,
  TableSessionStatus,
  DiscountType,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { slugify } from "../src/lib/slug";

// Duplicated from src/lib/password.ts (must match verifyPassword's format
// exactly) rather than imported — that module is `server-only`-guarded, which
// throws when run outside Next's build pipeline, same reason this script uses
// its own standalone PrismaClient above instead of src/lib/prisma.ts.
const PASSWORD_KEY_LENGTH = 64;
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

// A standalone client, deliberately not the app's `src/lib/prisma.ts`
// singleton — that one is `server-only`-guarded (correctly, to stop it being
// imported into client bundles), which throws when run outside Next's build
// pipeline, i.e. exactly how this script runs via `tsx`/`prisma db seed`.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BRANDS = [
  { slug: "coffee", name: "Voya Coffee", sortOrder: 0 },
  { slug: "papa", name: "Papa Voya", sortOrder: 1 },
  { slug: "mama", name: "Mama Voya", sortOrder: 2 },
] as const;

type SeedItem = { name: string; description: string; price: number };
type SeedCategory = { title: string; items: SeedItem[] };
type SeedBrand = { slug: (typeof BRANDS)[number]["slug"]; categories: SeedCategory[] };

const MENU: SeedBrand[] = [
  {
    slug: "coffee",
    categories: [
      {
        title: "Signature Roasts",
        items: [
          { name: "Voya Espresso", description: "A perfectly balanced double shot of our house blend.", price: 18 },
          { name: "Cortado", description: "Smooth espresso cut with a small amount of warm milk.", price: 22 },
          { name: "Flat White", description: "Equal parts espresso and steamed milk for a rich texture.", price: 24 },
          { name: "Pour Over", description: "Slow-dripped single origin coffee, brewed to perfection.", price: 28 },
        ],
      },
      {
        title: "Cold Brews",
        items: [
          { name: "Classic Cold Brew", description: "Steeped for 24 hours for a smooth, bold finish.", price: 26 },
          { name: "Nitro Vanilla", description: "Nitrogen-infused cold brew with a touch of Madagascar vanilla.", price: 32 },
          { name: "Iced Latte", description: "Chilled espresso and milk over craft ice.", price: 28 },
        ],
      },
      {
        title: "Artisan Pastries",
        items: [
          { name: "Butter Croissant", description: "Flaky, buttery, and baked fresh every morning.", price: 16 },
          { name: "Almond Danish", description: "Twice-baked croissant filled with almond frangipane.", price: 22 },
          { name: "Pain au Chocolat", description: "Crispy pastry with rich dark chocolate centers.", price: 20 },
        ],
      },
      {
        title: "Loose Leaf Teas",
        items: [
          { name: "Chamomile Bloom", description: "Whole chamomile flowers, honey-sweet and calming.", price: 20 },
          { name: "Earl Grey Reserve", description: "Bergamot-scented black tea with a citrus finish.", price: 20 },
          { name: "Peppermint Zen", description: "Cool, bright peppermint leaves, caffeine-free.", price: 18 },
        ],
      },
    ],
  },
  {
    slug: "papa",
    categories: [
      {
        title: "Wellness Bowls",
        items: [
          { name: "Green Goddess Bowl", description: "Kale, quinoa, avocado, edamame, and green tahini dressing.", price: 45 },
          { name: "Protein Power", description: "Grilled chicken, sweet potato, black beans, and roasted almonds.", price: 55 },
          { name: "Acai Glow", description: "Organic acai, house-made granola, fresh berries, and chia.", price: 42 },
        ],
      },
      {
        title: "Healthy Wraps",
        items: [
          { name: "Mediterranean Wrap", description: "Hummus, falafel, cucumber, tomatoes, and mixed greens.", price: 38 },
          { name: "Spicy Chicken Wrap", description: "Lean chicken breast, spicy yogurt sauce, and crisp lettuce.", price: 42 },
        ],
      },
      {
        title: "Fresh Juices",
        items: [
          { name: "Detox Green", description: "Spinach, celery, apple, lemon, and ginger.", price: 28 },
          { name: "Citrus Immunity", description: "Orange, grapefruit, turmeric, and a dash of cayenne.", price: 30 },
        ],
      },
      {
        title: "Smoothies",
        items: [
          { name: "Berry Bliss", description: "Mixed berries, banana, and Greek yogurt.", price: 34 },
          { name: "Green Machine", description: "Spinach, mango, pineapple, and coconut water.", price: 34 },
          { name: "Tropical Power", description: "Mango, passionfruit, banana, and protein.", price: 38 },
        ],
      },
    ],
  },
  {
    slug: "mama",
    categories: [
      {
        title: "Woodfired Pizzas",
        items: [
          { name: "Margherita Rustica", description: "San Marzano tomatoes, fresh mozzarella, and basil.", price: 65 },
          { name: "Truffle Mushroom", description: "Wild mushrooms, truffle oil, ricotta, and thyme.", price: 85 },
          { name: "Spicy Diavola", description: "Spicy salami, chili flakes, mozzarella, and honey drizzle.", price: 75 },
        ],
      },
      {
        title: "Handmade Pastas",
        items: [
          { name: "Truffle Pappardelle", description: "Fresh pappardelle in a creamy black truffle sauce.", price: 82 },
          { name: "Classic Rigatoni Ragu", description: "Slow-cooked beef ragu with parmigiano reggiano.", price: 78 },
          { name: "Linguine Vongole", description: "Clams, white wine, garlic, and fresh parsley.", price: 90 },
        ],
      },
      {
        title: "Antipasti",
        items: [
          { name: "Bruschetta Trio", description: "Tomato basil, mushroom truffle, and olive tapenade.", price: 40 },
          { name: "Caprese Salad", description: "Buffalo mozzarella, heirloom tomatoes, and basil oil.", price: 48 },
          { name: "Arancini", description: "Crispy risotto balls with a molten mozzarella center.", price: 38 },
        ],
      },
      {
        title: "Comfort Desserts",
        items: [
          { name: "Tiramisu", description: "Classic Italian dessert with espresso-soaked ladyfingers.", price: 45 },
          { name: "Panna Cotta", description: "Vanilla bean panna cotta with a mixed berry compote.", price: 38 },
        ],
      },
    ],
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

/** Samples `count` distinct items (no repeats within one draw) without mutating `items`. */
function pickMany<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    picked.push(pool.splice(randomInt(0, pool.length - 1), 1)[0]);
  }
  return picked;
}

function weightedPick<T>(weights: [T, number][]): T {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of weights) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return weights[weights.length - 1][0];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const MOCK_ORDER_COUNT = 10_000;
const MOCK_ORDER_DAYS_BACK = 90;
const MOCK_TABLE_NUMBERS = Array.from({ length: 14 }, (_, i) => i + 1);

const FIRST_NAMES = [
  "Ahmed", "Mohamed", "Youssef", "Omar", "Ali", "Khaled", "Amr", "Karim", "Hassan", "Mostafa",
  "Sara", "Mona", "Nour", "Yasmin", "Farida", "Laila", "Salma", "Aya", "Heba", "Dina", "Rana", "Mariam",
] as const;
const LAST_NAMES = [
  "Hassan", "Mostafa", "Ibrahim", "El-Sayed", "Farouk", "Adel", "Fathy", "Kamal", "Nabil", "Zaki", "Ashraf", "Rady", "Sherif",
] as const;
const STREETS = [
  "Tahrir St", "Nile Corniche", "26th of July St", "Salah Salem Rd", "Gameat El Dowal St",
  "El Merghany St", "Abbas El Akkad St", "Mostafa El Nahas St", "Zahraa El Maadi St", "Sheikh Zayed Blvd",
] as const;
const AREAS = ["Nasr City", "Maadi", "Zamalek", "Dokki", "Heliopolis", "New Cairo", "6th of October", "Mohandessin"] as const;
const SPECIAL_NOTES = [
  "No onions please", "Extra spicy", "Allergic to nuts", "Birthday celebration - add a candle",
  "Less sugar", "No dairy", "Extra napkins please", "Cutlery for 2 only", "Ring the bell twice",
] as const;
const REJECTION_REASONS = [
  "Item out of stock", "Kitchen too busy right now", "Customer changed their mind",
  "Duplicate order submitted", "Payment could not be verified", "Guest left before order was ready",
] as const;
const OFFER_CODES = [
  { code: "WELCOME10", discountType: DiscountType.PERCENT, discountValue: 10 },
  { code: "SAVE50", discountType: DiscountType.FIXED, discountValue: 50 },
  { code: "VIP15", discountType: DiscountType.PERCENT, discountValue: 15 },
  { code: "FIRSTORDER", discountType: DiscountType.FIXED, discountValue: 30 },
] as const;

function randomPhone(): string {
  const prefix = pickOne(["010", "011", "012", "015"]);
  const rest = Array.from({ length: 8 }, () => randomInt(0, 9)).join("");
  return `${prefix}${rest}`;
}

function buildCustomerPool(size: number): { name: string; phone: string }[] {
  const pool: { name: string; phone: string }[] = [];
  const seenPhones = new Set<string>();
  while (pool.length < size) {
    const phone = randomPhone();
    if (seenPhones.has(phone)) continue;
    seenPhones.add(phone);
    pool.push({ name: `${pickOne(FIRST_NAMES)} ${pickOne(LAST_NAMES)}`, phone });
  }
  return pool;
}

function randomAddress(): string {
  return `${randomInt(1, 140)} ${pickOne(STREETS)}, ${pickOne(AREAS)}, Cairo`;
}

function randomBirthday(): Date {
  const age = randomInt(18, 70);
  const year = new Date().getUTCFullYear() - age;
  return new Date(Date.UTC(year, randomInt(0, 11), randomInt(1, 28)));
}

/** Skews toward lunch (12-15) and dinner (18-22) rushes, quiet overnight, over the past `MOCK_ORDER_DAYS_BACK` days. */
function randomOrderTimestamp(now: Date): Date {
  const daysAgo = Math.random() * MOCK_ORDER_DAYS_BACK;
  const hourWeights: [number, number][] = Array.from({ length: 24 }, (_, hour) => {
    if (hour >= 18 && hour <= 22) return [hour, 6];
    if (hour >= 12 && hour <= 15) return [hour, 5];
    if (hour >= 7 && hour <= 11) return [hour, 2];
    if (hour <= 5) return [hour, 0.3];
    return [hour, 1];
  });
  const date = new Date(now.getTime() - daysAgo * 86_400_000);
  date.setUTCHours(weightedPick(hourWeights), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

/** Orders more than a few hours old have obviously finished one way or another by now. */
function randomOrderStatus(createdAt: Date, now: Date): OrderStatus {
  if (now.getTime() - createdAt.getTime() > 3 * 60 * 60 * 1000) {
    return weightedPick<OrderStatus>([
      [OrderStatus.SERVED, 90],
      [OrderStatus.REJECTED, 10],
    ]);
  }
  return weightedPick<OrderStatus>([
    [OrderStatus.SERVED, 55],
    [OrderStatus.REJECTED, 8],
    [OrderStatus.READY, 12],
    [OrderStatus.PREPARING, 15],
    [OrderStatus.RECEIVED, 10],
  ]);
}

type ItemPoolEntry = { id: string; name: string; price: number; brandSlug: string };
type TableRef = { id: string; number: number };

/**
 * Generates ~`MOCK_ORDER_COUNT` orders spread across the last `MOCK_ORDER_DAYS_BACK`
 * days with randomized items/quantities/types/tables/customers, then bulk-inserts
 * them. Wipes previously seeded orders first so re-running this script doesn't
 * pile up duplicates — dev/local only, same as the rest of this seed file.
 */
async function seedMockOrders(itemPool: ItemPoolEntry[], tables: TableRef[]) {
  for (const offer of OFFER_CODES) {
    await prisma.codeOffer.upsert({
      where: { code: offer.code },
      update: {},
      create: {
        code: offer.code,
        name: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        validFrom: new Date(Date.now() - (MOCK_ORDER_DAYS_BACK + 30) * 86_400_000),
        validUntil: new Date(Date.now() + 365 * 86_400_000),
        isActive: true,
      },
    });
  }

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.tableSession.deleteMany({});

  const now = new Date();
  const customerPool = buildCustomerPool(600);

  // One table can host several sittings across a day, and several orders
  // within one sitting — reuse an existing same-table/same-day session ~60%
  // of the time instead of opening a fresh one for every order.
  type SessionRecord = { id: string; tableId: string; openedAt: Date; lastOrderAt: Date };
  const sessionByKey = new Map<string, SessionRecord>();
  const allSessions: SessionRecord[] = [];

  function resolveTableSession(table: TableRef, createdAt: Date): string {
    const key = `${table.number}:${createdAt.toISOString().slice(0, 10)}`;
    const existing = sessionByKey.get(key);
    if (existing && Math.random() < 0.6) {
      if (createdAt < existing.openedAt) existing.openedAt = createdAt;
      if (createdAt > existing.lastOrderAt) existing.lastOrderAt = createdAt;
      return existing.id;
    }
    const record: SessionRecord = { id: randomUUID(), tableId: table.id, openedAt: createdAt, lastOrderAt: createdAt };
    sessionByKey.set(key, record);
    allSessions.push(record);
    return record.id;
  }

  const orders: {
    id: string;
    type: OrderType;
    tableSessionId: string | null;
    status: OrderStatus;
    customerName: string;
    customerPhone: string;
    customerBirthday: Date | null;
    deliveryAddress: string | null;
    specialNotes: string | null;
    rejectionReason: string | null;
    subtotal: number;
    offerCode: string | null;
    discountAmount: number;
    totalPrice: number;
    createdAt: Date;
  }[] = [];

  const orderItems: {
    id: string;
    orderId: string;
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    brandSlug: string;
  }[] = [];

  for (let i = 0; i < MOCK_ORDER_COUNT; i++) {
    const createdAt = randomOrderTimestamp(now);
    const type = weightedPick<OrderType>([
      [OrderType.ON_TABLE, 55],
      [OrderType.TAKEAWAY, 30],
      [OrderType.DELIVERY, 15],
    ]);

    const lines = pickMany(itemPool, randomInt(1, 5)).map((item) => ({ item, quantity: randomInt(1, 3) }));
    const subtotal = round2(lines.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0));

    const offer = Math.random() < 0.18 ? pickOne(OFFER_CODES) : null;
    const discountAmount = offer
      ? round2(
          offer.discountType === DiscountType.PERCENT
            ? subtotal * (offer.discountValue / 100)
            : Math.min(offer.discountValue, subtotal),
        )
      : 0;

    const status = randomOrderStatus(createdAt, now);
    const customer =
      Math.random() < 0.7
        ? pickOne(customerPool)
        : { name: `${pickOne(FIRST_NAMES)} ${pickOne(LAST_NAMES)}`, phone: randomPhone() };

    const orderId = randomUUID();
    orders.push({
      id: orderId,
      type,
      tableSessionId: type === OrderType.ON_TABLE ? resolveTableSession(pickOne(tables), createdAt) : null,
      status,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerBirthday: Math.random() < 0.25 ? randomBirthday() : null,
      deliveryAddress: type === OrderType.DELIVERY ? randomAddress() : null,
      specialNotes: Math.random() < 0.12 ? pickOne(SPECIAL_NOTES) : null,
      rejectionReason: status === OrderStatus.REJECTED ? pickOne(REJECTION_REASONS) : null,
      subtotal,
      offerCode: offer?.code ?? null,
      discountAmount,
      totalPrice: round2(subtotal - discountAmount),
      createdAt,
    });

    for (const { item, quantity } of lines) {
      orderItems.push({
        id: randomUUID(),
        orderId,
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        brandSlug: item.brandSlug,
      });
    }
  }

  // Most recently opened sittings are left OPEN, simulating tables currently occupied.
  const sortedSessions = [...allSessions].sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
  const OPEN_SESSION_COUNT = 6;
  const tableSessions = sortedSessions.map((session, index) => {
    const isStillOpen = index >= sortedSessions.length - OPEN_SESSION_COUNT;
    return {
      id: session.id,
      tableId: session.tableId,
      status: isStillOpen ? TableSessionStatus.OPEN : TableSessionStatus.SETTLED,
      openedAt: session.openedAt,
      settledAt: isStillOpen ? null : new Date(session.lastOrderAt.getTime() + randomInt(15, 90) * 60_000),
    };
  });

  async function insertInBatches<T>(items: T[], insert: (batch: T[]) => Promise<unknown>) {
    const BATCH_SIZE = 1000;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      await insert(items.slice(i, i + BATCH_SIZE));
    }
  }

  await insertInBatches(tableSessions, (batch) => prisma.tableSession.createMany({ data: batch }));
  await insertInBatches(orders, (batch) => prisma.order.createMany({ data: batch }));
  await insertInBatches(orderItems, (batch) => prisma.orderItem.createMany({ data: batch }));

  console.log(
    `Seeded ${orders.length} mock orders (${orderItems.length} line items, ${tableSessions.length} table sessions) over the last ${MOCK_ORDER_DAYS_BACK} days.`,
  );
}

async function main() {
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      passwordHash: hashPassword("1234qwer"),
      role: "ADMIN",
    },
  });

  const brandIds = new Map<string, string>();

  for (const brand of BRANDS) {
    const record = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, sortOrder: brand.sortOrder },
      create: brand,
    });
    brandIds.set(brand.slug, record.id);
  }

  // Menu content below is a fixed, repeatable seed — re-running this script
  // wipes and replaces all categories/items (not brands). Don't run against
  // a database with real edits you want to keep.
  await prisma.item.deleteMany({});
  await prisma.category.deleteMany({});

  for (const brand of MENU) {
    const brandId = brandIds.get(brand.slug);
    if (!brandId) throw new Error(`Unknown brand slug: ${brand.slug}`);

    for (const [categoryIndex, category] of brand.categories.entries()) {
      await prisma.category.create({
        data: {
          brandId,
          title: category.title,
          slug: slugify(category.title),
          sortOrder: categoryIndex,
          items: {
            create: category.items.map((item, itemIndex) => ({
              name: item.name,
              description: item.description,
              price: item.price,
              sortOrder: itemIndex,
            })),
          },
        },
      });
    }
  }

  const [categoryCount, itemCount] = await Promise.all([
    prisma.category.count(),
    prisma.item.count(),
  ]);
  console.log(`Seeded ${categoryCount} categories and ${itemCount} items.`);

  const tables: TableRef[] = await Promise.all(
    MOCK_TABLE_NUMBERS.map((number) =>
      prisma.restaurantTable.upsert({
        where: { number },
        update: {},
        create: { number },
      }),
    ),
  );

  const items = await prisma.item.findMany({ include: { category: { include: { brand: true } } } });
  const itemPool: ItemPoolEntry[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price.toNumber(),
    brandSlug: item.category.brand.slug,
  }));

  await seedMockOrders(itemPool, tables);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
