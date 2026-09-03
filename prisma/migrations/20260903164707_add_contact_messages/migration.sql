-- CreateTable
CREATE TABLE "contact_subjects" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "label_ar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "subject_id" TEXT,
    "subject_label" TEXT,
    "subject_label_ar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "contact_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
