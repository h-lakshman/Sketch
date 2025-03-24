-- CreateEnum
CREATE TYPE "StrokeStyle" AS ENUM ('SOLID', 'DASHED', 'DOTTED');

-- AlterTable
ALTER TABLE "Diamond" ADD COLUMN     "strokeStyle" "StrokeStyle" NOT NULL DEFAULT 'SOLID',
ADD COLUMN     "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Ellipse" ADD COLUMN     "strokeStyle" "StrokeStyle" NOT NULL DEFAULT 'SOLID',
ADD COLUMN     "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Line" ADD COLUMN     "strokeStyle" "StrokeStyle" NOT NULL DEFAULT 'SOLID',
ADD COLUMN     "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "LineWithArrow" ADD COLUMN     "strokeStyle" "StrokeStyle" NOT NULL DEFAULT 'SOLID',
ADD COLUMN     "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Pen" ADD COLUMN     "strokeStyle" "StrokeStyle" NOT NULL DEFAULT 'SOLID',
ADD COLUMN     "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Rectangle" ADD COLUMN     "strokeStyle" "StrokeStyle" NOT NULL DEFAULT 'SOLID',
ADD COLUMN     "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 2;
