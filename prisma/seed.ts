import "dotenv/config";
import { PrismaClient, OrderStatus, OrderType, TableSessionStatus } from "../src/generated/prisma/client";
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
