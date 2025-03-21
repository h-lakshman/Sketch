/*
  Warnings:

  - The values [CIRCLE,TRIANGLE] on the enum `ShapeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShapeType_new" AS ENUM ('RECTANGLE', 'ELLIPSE', 'PEN');
ALTER TABLE "Shape" ALTER COLUMN "type" TYPE "ShapeType_new" USING ("type"::text::"ShapeType_new");
ALTER TYPE "ShapeType" RENAME TO "ShapeType_old";
ALTER TYPE "ShapeType_new" RENAME TO "ShapeType";
DROP TYPE "ShapeType_old";
COMMIT;

-- CreateTable
CREATE TABLE "Ellipse" (
    "id" SERIAL NOT NULL,
    "shapeId" INTEGER NOT NULL,
    "centerX" DOUBLE PRECISION NOT NULL,
    "centerY" DOUBLE PRECISION NOT NULL,
    "radiusX" DOUBLE PRECISION NOT NULL,
    "radiusY" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Ellipse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pen" (
    "id" SERIAL NOT NULL,
    "shapeId" INTEGER NOT NULL,
    "points" JSONB NOT NULL,

    CONSTRAINT "Pen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ellipse_shapeId_key" ON "Ellipse"("shapeId");

-- CreateIndex
CREATE UNIQUE INDEX "Pen_shapeId_key" ON "Pen"("shapeId");

-- AddForeignKey
ALTER TABLE "Ellipse" ADD CONSTRAINT "Ellipse_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pen" ADD CONSTRAINT "Pen_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
