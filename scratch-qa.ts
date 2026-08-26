import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function hash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function setup() {
  await prisma.user.upsert({
    where: { username: "qa_reject_tmp" },
    update: { passwordHash: hash("QaReject!234"), role: "ADMIN" },
    create: { username: "qa_reject_tmp", name: "QA Reject", role: "ADMIN", passwordHash: hash("QaReject!234") },
  });
  const item = await prisma.item.findFirst({ where: { isAvailable: true }, include: { category: { include: { brand: true } } } });
  if (!item) throw new Error("no item");
  const order = await prisma.order.create({
    data: {
      type: "TAKEAWAY",
      status: "RECEIVED",
      customerName: "QA Reject Tester",
      customerPhone: "01000000000",
      subtotal: item.price,
      discountAmount: 0,
      totalPrice: item.price,
      items: {
        create: [{ itemId: item.id, name: item.name, price: item.price, quantity: 1, brandSlug: item.category.brand.slug }],
      },
    },
  });
  console.log("order", order.id);
}

async function inspect() {
  const orders = await prisma.order.findMany({
    where: { customerName: "QA Reject Tester" },
    select: { id: true, status: true, rejectionReason: true },
  });
  console.log(JSON.stringify(orders, null, 2));
}

async function teardown() {
  const orders = await prisma.order.findMany({ where: { customerName: "QA Reject Tester" }, select: { id: true } });
  const ids = orders.map((o) => o.id);
  await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.order.deleteMany({ where: { id: { in: ids } } });
  const user = await prisma.user.findUnique({ where: { username: "qa_reject_tmp" } });
  if (user) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  console.log("cleaned", ids.length, "orders");
}

const mode = process.argv[2];
const run = mode === "teardown" ? teardown : mode === "inspect" ? inspect : setup;
run().finally(() => prisma.$disconnect());
