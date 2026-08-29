-- AlterTable
ALTER TABLE "code_offers" ADD COLUMN     "banner_image_desktop" TEXT,
ADD COLUMN     "banner_image_mobile" TEXT,
ADD COLUMN     "show_on_menu" BOOLEAN NOT NULL DEFAULT false;
