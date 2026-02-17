-- CreateTable
CREATE TABLE "PreConfiguredRole" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreConfiguredRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreConfiguredRole_discordId_key" ON "PreConfiguredRole"("discordId");
