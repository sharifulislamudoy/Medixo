-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" SERIAL NOT NULL,
    "dailyCutoffHour" INTEGER NOT NULL DEFAULT 11,
    "dailyCutoffMinute" INTEGER NOT NULL DEFAULT 0,
    "minFirstOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderOffStart" TIMESTAMP(3),
    "orderOffEnd" TIMESTAMP(3),

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
