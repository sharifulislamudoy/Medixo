-- CreateTable
CREATE TABLE "Marquee" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marquee_pkey" PRIMARY KEY ("id")
);
