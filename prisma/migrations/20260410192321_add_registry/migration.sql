-- CreateEnum
CREATE TYPE "RegistryType" AS ENUM ('REGISTRY', 'FUND');

-- CreateTable
CREATE TABLE "Registry" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "type" "RegistryType" NOT NULL DEFAULT 'REGISTRY',
    "store" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Registry" ADD CONSTRAINT "Registry_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
