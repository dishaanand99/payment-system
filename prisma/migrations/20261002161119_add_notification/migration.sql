-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "recipientRole" TEXT,
    "recipientUserId" TEXT,
    "donationId" TEXT,
    "bankTransactionId" TEXT,
    "paymentGatewayTransactionId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");
