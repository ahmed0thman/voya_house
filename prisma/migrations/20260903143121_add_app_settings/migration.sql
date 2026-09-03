-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "whatsapp_order_number" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
