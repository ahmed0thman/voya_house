-- CreateTable
CREATE TABLE "password_reset_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_challenges_token_hash_key" ON "password_reset_challenges"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_challenges_user_id_idx" ON "password_reset_challenges"("user_id");

-- AddForeignKey
ALTER TABLE "password_reset_challenges" ADD CONSTRAINT "password_reset_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
