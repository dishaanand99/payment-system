-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "donorPan" TEXT,
    "donorAddress" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentScreenshotPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "utr" TEXT,
    "receiptNumber" TEXT,
    "donatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'DIRECT',
    "externalReference" TEXT,
    "idempotencyKey" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" DATETIME,
    CONSTRAINT "Donation_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Donation" ("amount", "createdAt", "currency", "donatedAt", "donorAddress", "donorEmail", "donorName", "donorPan", "donorPhone", "id", "paymentMethod", "paymentScreenshotPath", "receiptNumber", "status", "updatedAt", "utr", "verifiedAt", "verifiedById") SELECT "amount", "createdAt", "currency", "donatedAt", "donorAddress", "donorEmail", "donorName", "donorPan", "donorPhone", "id", "paymentMethod", "paymentScreenshotPath", "receiptNumber", "status", "updatedAt", "utr", "verifiedAt", "verifiedById" FROM "Donation";
DROP TABLE "Donation";
ALTER TABLE "new_Donation" RENAME TO "Donation";
CREATE UNIQUE INDEX "Donation_utr_key" ON "Donation"("utr");
CREATE UNIQUE INDEX "Donation_receiptNumber_key" ON "Donation"("receiptNumber");
CREATE UNIQUE INDEX "Donation_idempotencyKey_key" ON "Donation"("idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
