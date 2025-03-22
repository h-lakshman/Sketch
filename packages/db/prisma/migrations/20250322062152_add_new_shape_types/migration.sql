-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShapeType" ADD VALUE 'LINE';
ALTER TYPE "ShapeType" ADD VALUE 'LINE_WITH_ARROW';
ALTER TYPE "ShapeType" ADD VALUE 'DIAMOND';
ALTER TYPE "ShapeType" ADD VALUE 'TEXT';

-- CreateTable
CREATE TABLE "Line" (
    "id" SERIAL NOT NULL,
    "shapeId" INTEGER NOT NULL,
    "startX" DOUBLE PRECISION NOT NULL,
    "startY" DOUBLE PRECISION NOT NULL,
    "endX" DOUBLE PRECISION NOT NULL,
    "endY" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineWithArrow" (
    "id" SERIAL NOT NULL,
    "shapeId" INTEGER NOT NULL,
    "startX" DOUBLE PRECISION NOT NULL,
    "startY" DOUBLE PRECISION NOT NULL,
    "endX" DOUBLE PRECISION NOT NULL,
    "endY" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LineWithArrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diamond" (
    "id" SERIAL NOT NULL,
    "shapeId" INTEGER NOT NULL,
    "centerX" DOUBLE PRECISION NOT NULL,
    "centerY" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Diamond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Text" (
    "id" SERIAL NOT NULL,
    "shapeId" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "content" TEXT NOT NULL,
    "fontSize" DOUBLE PRECISION NOT NULL DEFAULT 16,

    CONSTRAINT "Text_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Line_shapeId_key" ON "Line"("shapeId");

-- CreateIndex
CREATE UNIQUE INDEX "LineWithArrow_shapeId_key" ON "LineWithArrow"("shapeId");

-- CreateIndex
CREATE UNIQUE INDEX "Diamond_shapeId_key" ON "Diamond"("shapeId");

-- CreateIndex
CREATE UNIQUE INDEX "Text_shapeId_key" ON "Text"("shapeId");

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineWithArrow" ADD CONSTRAINT "LineWithArrow_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diamond" ADD CONSTRAINT "Diamond_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Text" ADD CONSTRAINT "Text_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
