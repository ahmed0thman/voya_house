-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "two_factor_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_challenges_token_hash_key" ON "two_factor_challenges"("token_hash");

-- CreateIndex
CREATE INDEX "two_factor_challenges_user_id_idx" ON "two_factor_challenges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "two_factor_challenges" ADD CONSTRAINT "two_factor_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
