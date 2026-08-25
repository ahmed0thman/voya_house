/*
  Warnings:

  - You are about to drop the column `table_id` on the `orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TableSessionStatus" AS ENUM ('OPEN', 'SETTLED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('ON_TABLE', 'TAKEAWAY', 'DELIVERY');

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_table_id_fkey";

-- DropIndex
DROP INDEX "orders_table_id_created_at_idx";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "table_id",
ADD COLUMN     "table_session_id" TEXT,
ADD COLUMN     "type" "OrderType" NOT NULL DEFAULT 'ON_TABLE';

-- CreateTable
CREATE TABLE "table_sessions" (
    "id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "status" "TableSessionStatus" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "table_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "table_sessions_table_id_status_idx" ON "table_sessions"("table_id", "status");

-- CreateIndex
CREATE INDEX "orders_table_session_id_created_at_idx" ON "orders"("table_session_id", "created_at");

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_session_id_fkey" FOREIGN KEY ("table_session_id") REFERENCES "table_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
